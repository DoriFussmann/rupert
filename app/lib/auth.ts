import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET || (() => {
    throw new Error('JWT_SECRET or AUTH_JWT_SECRET environment variable must be set');
  })()
)

export async function signJWT(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    throw new Error('Invalid token')
  }
}
