import { FastifyRequest, FastifyReply } from 'fastify';
import { verify } from 'jsonwebtoken';
import { CONFIG } from '../config';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export function adminOnly(request: FastifyRequest, reply: FastifyReply) {
  if (request.user?.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required' });
  }
}
