// import mysql from "serverless-mysql";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

export const conn = mysql.createPool({
  host: process.env.HOST_NAME,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});
