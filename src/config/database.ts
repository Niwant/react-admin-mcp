import { MongoClient, ReadConcernLevel, ReadPreferenceMode, W } from 'mongodb';
import path from 'path';
import os from 'os';
import argv from 'yargs-parser';

export interface DatabaseConnectOptions {
    readConcern: ReadConcernLevel;
    readPreference: ReadPreferenceMode;
    writeConcern: W;
    timeoutMS: number;
}

export interface DatabaseConfig {
    uri: string;
    name: string;
    logPath: string;
    connectOptions: DatabaseConnectOptions;
    readOnly?: boolean;
}

const defaults: DatabaseConfig = {
    uri: "mongodb+srv://nsalunke:nsal123@niwant.qaqlo.mongodb.net/?retryWrites=true&w=majority&appName=Niwant",
    name: "sample_mflix",
    logPath: getLogPath(),
    connectOptions: {
        readConcern: "local",
        readPreference: "secondaryPreferred",
        writeConcern: "majority",
        timeoutMS: 30_000,
    },
    readOnly: false,
};

// Parse CLI arguments first
const cliArgs = argv(process.argv.slice(2), {
    string: ['uri', 'name', 'logPath'],
    boolean: ['readOnly'],
    number: ['timeoutMS'],
    default: {
        uri: process.env.MDB_DB_URI || defaults.uri,
        name: process.env.MDB_DB_NAME || defaults.name,
        readOnly: process.env.MDB_DB_READONLY === 'true' || defaults.readOnly,
        timeoutMS: Number(process.env.MDB_DB_TIMEOUT_MS) || defaults.connectOptions.timeoutMS,
    }
});

export const dbConfig: DatabaseConfig = {
    ...defaults,
    uri: cliArgs.uri,
    name: cliArgs.name,
    readOnly: cliArgs.readOnly,
    connectOptions: {
        ...defaults.connectOptions,
        timeoutMS: cliArgs.timeoutMS,
    }
};

function getLogPath(): string {
    const localDataPath = process.platform === "win32"
        ? path.join(process.env.LOCALAPPDATA || process.env.APPDATA || os.homedir(), "mongodb")
        : path.join(os.homedir(), ".mongodb");

    return path.join(localDataPath, "mongodb-mcp", ".app-logs");
}

export async function getMongoClient() {
    const client = new MongoClient(dbConfig.uri);
    await client.connect();
    return client;
}

export async function getDatabase() {
    const client = await getMongoClient();
    return client.db(dbConfig.name);
} 