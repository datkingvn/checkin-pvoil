import mongoose from 'mongoose';

const sourceURI = process.env.MONGODB_URI!;

if (!sourceURI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Transparently handle MongoDB URI for specialized environments (Docker/Local/ReplicaSet)
const getEffectiveUri = (uri: string): string => {
  try {
    // If it's not a valid URI format, return as is (let Mongoose validate it)
    if (!uri.startsWith('mongodb')) return uri;

    const url = new URL(uri);
    const searchParams = url.searchParams;

    // 1. Transaction Support: Auto-append `replicaSet=rs0` if missing
    // We assume 'rs0' if not specified, which matches our Docker Setup.
    if (!searchParams.has('replicaSet')) {
      searchParams.set('replicaSet', 'rs0');
    }

    // 2. Connectivity Fix: Handle `directConnection`
    // - Localhost/127.0.0.1: Often implies "Hybrid Mode" (App Local -> Docker DB).
    //   We MUST force `directConnection=true` to ignore the Docker internal hostname ('mongo').
    // - Other Hosts (e.g., MongoDB Atlas, 'mongo' service name):
    //   We MUST NOT force `directConnection` because we want driver to discover members.
    const hostname = url.hostname.toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal && !searchParams.has('directConnection')) {
      searchParams.set('directConnection', 'true');
    }

    // Logging for visibility in Dev
    if (process.env.NODE_ENV === 'development') {
      const logUrl = new URL(url.toString());
      if (logUrl.password) logUrl.password = '******'; // Hide password
      console.log(`[Mongo] Connecting to: ${logUrl.toString()}`);
    }

    return url.toString();
  } catch (error) {
    console.warn('[Mongo] Failed to parse URI, using original:', error);
    return uri;
  }
};

const MONGODB_URI = getEffectiveUri(sourceURI);

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
