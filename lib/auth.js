import jwt from 'jsonwebtoken';

export function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(request) {
  const user = getUserFromToken(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function requireAdmin(request) {
  const user = requireAuth(request);
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}