import 'dotenv/config'
export const PROTOCOL = 'http';
export const HOST = 'localhost:3000';
export const NODE_ENV = process.env.NODE_ENV;
export let SERVER_URL;
if (NODE_ENV == 'local') {
    SERVER_URL = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`;
} 
else {
    SERVER_URL = `${process.env.SERVER_HOST}`;
}