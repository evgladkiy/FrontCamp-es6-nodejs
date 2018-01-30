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

function getNextArticlesId() {
    const maxId =  articles.reduce((acc, next) => {

        if (Number(next._id) > acc) {
            return Number(next._id);
        }

        return acc;
    }, 0);

    return String(maxId + 1);
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
    const newArticle = Object.assign({ _id : getNextArticlesId() }, req.body);
    const msg = `Atricle '${newArticle.title}' by ${newArticle.author} was added`;

    articles.push(newArticle);
    updateArticles(res, articles, msg);
});

app.use('/blogs/:id', (req, res, next) => {
    const id = req.params.id;
    const articleIndex = articles.findIndex(article => article._id === id);

    if (articleIndex >= 0) {
        req.articleIndex = articleIndex;
        req.article = articles[articleIndex];
    }
    next();
});

app.use('/blogs/:id', (req, res, next) => {
    if (!req.article) {
        if (req.method === 'PUT' || req.method === 'DELETE') {
            res.status(404)
            .send(JSON.stringify({
                status: 'fail',
                msg: `Can not find blog id: ${req.params.id}`,
            }));
        } else if (req.method === 'GET') {
            consoleLogger('warn', `Can not find the article with id ${req.params.id}, redirect to eror page`);
            res.redirect('/404');
        }
    } else {
        next();
    }
});

app.get('/blogs/:id', (req, res) => {
    const article = req.article;

    res.send(article);
    consoleLogger('info', `Send atricle - id: ${article._id}, author: ${article.author}`);
});

app.put('/blogs/:id', (req, res) => {
    let { article, articleIndex } = req;

    const msg = `Atricle id - ${article._id} was changed`;

    article = Object.assign(article, req.body);
    articles.splice(articleIndex, 1, article);
    updateArticles(res, articles, msg);
});

app.delete('/blogs/:id', (req, res) => {
    let { article, articleIndex } = req;

    const msg = `Atricle '${article.title}' by ${article.author} was deleted`;

    articles.splice(articleIndex, 1);
    updateArticles(res, articles, msg);
});

app.get('/', (req, res) => {
    consoleLogger('info', 'Send home page');
    res.render('index', { title: 'Blogs' });
});

app.get('/404', (req, res) => {
    consoleLogger('info', 'Send 404 error page');
    res.render('404', { title: 'Blogs Error' });
});

app.get('**', (req, res) => {
    if (req.originalUrl.indexOf('.') < 0) {
        consoleLogger('warn', `Route '${req.originalUrl}' not configured, redirect to 404 page`);
        res.redirect('/404');
    } else {
        fs.readFile(req.originalUrl, (err, data) => {
            if (err) consoleLogger('warn', `File '${req.originalUrl}' not found`);
            res.send(data);
        });
    }
});

app.listen(4444);
