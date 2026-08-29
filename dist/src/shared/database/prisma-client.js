import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { ShardId } from "../types/shared-types.js";
// separate prisma client for each shard using mariaDB adapter
let shard1Client = null;
let shard2Client = null;
function getShard1AdapterOptions() {
    const url = process.env.DATABASE_SHARD1_URL;
    if (url) {
        try {
            const u = new URL(url);
            return {
                host: u.hostname,
                port: parseInt(u.port || "3306", 10),
                username: u.username,
                password: u.password,
                database: u.pathname.replace(/^\//, "") || "wallet",
                connectionLimit: 5,
            };
        }
        catch (error) {
            throw new Error(`Invalid DATABASE_URL_SHARD_1 : ${url}`);
        }
    }
    return {
        host: process.env.DB_SHARD1_HOST || "localhost",
        port: parseInt(process.env.DB_SHARD1_PORT || "3306", 10),
        username: process.env.DB_SHARD1_USERNAME || "root",
        password: process.env.DB_SHARD1_PASSWORD || "",
        database: process.env.DB_SHARD1_DATABASE || "wallet_shard1",
        connectionLimit: 5,
    };
}
function getShard2AdapterOptions() {
    const url = process.env.DATABASE_SHARD2_URL;
    if (url) {
        try {
            const u = new URL(url);
            return {
                host: u.hostname,
                port: parseInt(u.port || "3306", 10),
                username: u.username,
                password: u.password,
                database: u.pathname.replace(/^\//, "") || "wallet",
                connectionLimit: 5,
            };
        }
        catch (error) {
            throw new Error(`Invalid DATABASE_URL_SHARD_2 : ${url}`);
        }
    }
    return {
        host: process.env.DB_SHARD2_HOST || "localhost",
        port: parseInt(process.env.DB_SHARD2_PORT || "3306", 10),
        username: process.env.DB_SHARD2_USERNAME || "root",
        password: process.env.DB_SHARD2_PASSWORD || "",
        database: process.env.DB_SHARD2_DATABASE || "wallet_shard1",
        connectionLimit: 5,
    };
}
export function getShard1Client() {
    if (!shard1Client) {
        const adapter = new PrismaMariaDb(getShard1AdapterOptions());
        shard1Client = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === "development"
                ? ["query", "warn", "error"]
                : ["error"],
        });
    }
    return shard1Client;
}
export function getShard2Client() {
    if (!shard2Client) {
        const adapter = new PrismaMariaDb(getShard2AdapterOptions());
        shard2Client = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === "development"
                ? ["query", "warn", "error"]
                : ["error"],
        });
    }
    return shard2Client;
}
export function getPrismaClient(shardId) {
    return shardId == ShardId.SHARD_1 ? getShard1Client() : getShard2Client();
}
export async function closePrimsaClient() {
    if (shard1Client) {
        await shard1Client.$disconnect();
        shard1Client = null;
        console.log("Shard 1 Client Disconnected!");
    }
    if (shard2Client) {
        await shard2Client.$disconnect();
        shard2Client = null;
        console.log("Shard 2 Client Disconnected!");
    }
}
//# sourceMappingURL=prisma-client.js.map