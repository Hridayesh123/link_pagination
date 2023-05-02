import * as express from 'express';
import * as bodyParser from 'body-parser';
import Routes from './routes_container/Routes';
import { Server } from 'http';
import * as jwt from 'jsonwebtoken';
import { seq } from './models/models';

const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', Routes);
// app.use('/subject', Routes);

const server: Server = app.listen(port, async () => {
// await seq.sync({alter: true});
    console.log(`Server is running on port ${port}`);
});

export default server;