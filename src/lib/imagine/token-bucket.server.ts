/** Atomic PostgreSQL token bucket shared across serverless instances. */
export type TokenBucketSql = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

export type TokenBucketConfig = {
  key: string;
  capacity: number;
  refillPerSecond: number;
  cost?: number;
};

export async function consumeTokenBucket(
  sql: TokenBucketSql,
  { key, capacity, refillPerSecond, cost = 1 }: TokenBucketConfig,
): Promise<boolean> {
  if (
    !key || key.length > 256 ||
    !Number.isFinite(capacity) || capacity <= 0 ||
    !Number.isFinite(refillPerSecond) || refillPerSecond <= 0 ||
    !Number.isFinite(cost) || cost <= 0 || cost > capacity
  ) {
    throw new Error("Invalid token bucket configuration.");
  }

  const rows = await sql.query<{ tokens: number | string }>(
    `INSERT INTO imagine_token_buckets (bucket_key, tokens, updated_at)
     VALUES ($1, GREATEST($2::double precision - $4::double precision, 0), clock_timestamp())
     ON CONFLICT (bucket_key)
     DO UPDATE SET
       tokens = LEAST(
         $2::double precision,
         imagine_token_buckets.tokens +
           GREATEST(EXTRACT(EPOCH FROM (clock_timestamp() - imagine_token_buckets.updated_at)), 0) * $3::double precision
       ) - $4::double precision,
       updated_at = clock_timestamp()
     WHERE LEAST(
       $2::double precision,
       imagine_token_buckets.tokens +
         GREATEST(EXTRACT(EPOCH FROM (clock_timestamp() - imagine_token_buckets.updated_at)), 0) * $3::double precision
     ) >= $4::double precision
     RETURNING tokens`,
    [key, capacity, refillPerSecond, cost],
  );
  return rows.length === 1;
}

/** Pure model for deterministic unit tests and operator capacity planning. */
export function refillTokenBucket(
  tokens: number,
  elapsedSeconds: number,
  capacity: number,
  refillPerSecond: number,
): number {
  if (![tokens, elapsedSeconds, capacity, refillPerSecond].every(Number.isFinite) ||
      tokens < 0 || elapsedSeconds < 0 || capacity <= 0 || refillPerSecond <= 0) {
    throw new Error("Invalid token bucket state.");
  }
  return Math.min(capacity, tokens + elapsedSeconds * refillPerSecond);
}
