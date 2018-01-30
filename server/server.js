const express = require('express');
const fs = require('fs');

const requestLogger = require('./loggers/requestLogger');
const consoleLogger = require('./loggers/consoleLogger');
let articles = require('./data/articles.json');

const app = express();

app.use(express.json());
app.set('view engine', 'pug');

function updateArticles(res, articles, msg) {
    fs.writeFile('./data/articles.json', JSON.stringify(articles), (err) => {
        if (err) throw err;

        const resObj = {
            status: 'OK',
            msg,
        };

        res.send(JSON.stringify(resObj));
        consoleLogger('info', msg);
    });
}

app.use((req, res, next) => {
    requestLogger(req);
    next();
});

app.get('/blogs', (req, res) => {
    res.send(articles);
    consoleLogger('info', `Send ${articles.length} articles`);
});

app.post('/blogs', (req, res) => {
    let maxId = articles.reduce((acc, next) => {

        if (Number(next._id) > acc) {
            return Number(next._id);
        }

        return acc;
    }, 0);

    const newArticle = Object.assign({ _id : String(++maxId) }, req.body);
    const msg = `Atricle '${newArticle.title}' by ${newArticle.author} was added`;

    articles.push(newArticle);
    updateArticles(res, articles, msg);
});

app.get('/blogs/:id', (req, res) => {
    const id = req.params.id;
    const article = articles.find(article => article._id === id);

    if (article) {
        res.send(article);
        consoleLogger('info', `Send atricle - id: ${article._id}, author: ${article.author}`);
    } else {
        consoleLogger('warn', `Can not find the article with id ${id}, redirect to home page`);
        res.redirect('/');
    }
});

app.put('/blogs/:id', (req, res) => {
    const id = req.params.id;
    const chengedArticleIndex = articles.findIndex(article => article._id === id);

    if (chengedArticleIndex >= 0) {
        let article = articles[chengedArticleIndex];
        const msg = `Atricle id - ${id} was changed`;

        article = Object.assign(article, req.body);
        articles.splice(chengedArticleIndex, 1, article);
        updateArticles(res, articles, msg);
    } else {
        res.send(JSON.stringify({
            status: 'fail',
            msg: `Can not find bog id: ${id}`,
        }));
    }
});

app.delete('/blogs/:id', (req, res) => {
    const id = req.params.id;
    const deletedArticleIndex = articles.findIndex(article => article._id === id);

    if (deletedArticleIndex >= 0) {
        const article = articles[deletedArticleIndex];
        const msg = `Atricle '${article.title}' by ${article.author} was deleted`;

        articles.splice(deletedArticleIndex, 1);
        updateArticles(res, articles, msg);
    } else {
        res.send(JSON.stringify({
            status: 'fail',
            msg: `Can not find bog id: ${id}`,
        }));
    }
});

app.get('/', (req, res) => {
    consoleLogger('info', 'Send home page');
    res.render('index', { title: 'Blogs' });
});

app.get('**', (req, res) => {
    if (req.originalUrl.indexOf('.') < 0) {
        consoleLogger('warn', `Route '${req.originalUrl}' not configured, redirect to home page`);
        res.redirect('/');
    } else {
        fs.readFile(req.originalUrl, (err, data) => {
            if (err) consoleLogger('warn', `File '${req.originalUrl}' not found`);
            res.send(data);
        });
    }
});

app.listen(4444);
