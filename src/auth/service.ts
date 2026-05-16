import { validateToken } from '@sentilis/core';

export class AuthService {
	async authenticateToken(
		token: string
	): Promise<string | null> {
		try {
			return await validateToken(token);
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}
