import { requestUrl } from 'obsidian';

import {
	API_CONFIG,
	AUTH_ENDPOINT,
	MARKET_ENDPOINT,
	PRESS_ENDPOINT,
} from './endpoints';

import { ApiResponse } from './types';

import { basicAuth } from './auth';

import {
	PressItem,
	ProductItem,
	PressDetailItem,
} from '../types/content';

async function serializeFormData(
	formData: FormData
): Promise<{
	body: ArrayBuffer;
	contentType: string;
}> {
	const boundary =
		'----SentilisBoundary' +
		Math.random()
			.toString(36)
			.slice(2) +
		Date.now().toString(36);

	const encoder = new TextEncoder();
	const parts: Uint8Array[] = [];

	for (const [name, value] of (
		formData as unknown as {
			entries: () => Iterable<
				[string, FormDataEntryValue]
			>;
		}
	).entries()) {
		parts.push(
			encoder.encode(
				`--${boundary}\r\n`
			)
		);

		if (typeof value === 'string') {
			parts.push(
				encoder.encode(
					`Content-Disposition: form-data; name="${name}"\r\n\r\n`
				)
			);
			parts.push(encoder.encode(value));
			parts.push(encoder.encode('\r\n'));
		} else {
			const blob = value as Blob;
			const filename =
				(blob as File).name || 'blob';
			const contentType =
				blob.type ||
				'application/octet-stream';

			parts.push(
				encoder.encode(
					`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`
				)
			);
			parts.push(
				encoder.encode(
					`Content-Type: ${contentType}\r\n\r\n`
				)
			);

			const ab = await blob.arrayBuffer();
			parts.push(new Uint8Array(ab));
			parts.push(encoder.encode('\r\n'));
		}
	}

	parts.push(
		encoder.encode(
			`--${boundary}--\r\n`
		)
	);

	const totalLength = parts.reduce(
		(acc, p) => acc + p.byteLength,
		0
	);
	const combined = new Uint8Array(
		totalLength
	);
	let offset = 0;
	for (const p of parts) {
		combined.set(p, offset);
		offset += p.byteLength;
	}

	return {
		body: combined.buffer,
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}

export class ApiClient {
	private async request<T>(
		url: string,
		method: string = 'GET',
		token?: string,
		body?: string | ArrayBuffer,
		extraHeaders?: Record<string, string>
	): Promise<ApiResponse<T>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${url}`,

					method,

					throw: false,

					headers: {
						...(token && {
							Authorization:
								basicAuth(token),
						}),

						...(extraHeaders ?? {
							'Content-Type':
								'application/json',
						}),
					},

					body,
				});

			if (
				response.status < 200 ||
				response.status >= 300
			) {
				const errText =
					response.text ||
					`HTTP ${response.status}`;

				return {
					success: false,

					error: errText,
				};
			}

			return {
				success: true,

				data: response.json?.data,
			};
		} catch (error) {
			console.error(error);

			return {
				success: false,

				error:
					(error as Error)?.message ||
					'Request failed',
			};
		}
	}

	async validateToken(
		token: string
	): Promise<ApiResponse<string>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${AUTH_ENDPOINT}`,

					method: 'GET',

					throw: false,

					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			if (
				response.status < 200 ||
				response.status >= 300
			) {
				return {
					success: false,

					error:
						response.text ||
						'Authentication failed',
				};
			}

			return {
				success: true,

				data: response.json?.data
					?.username,
			};
		} catch (error) {
			console.error(error);

			return {
				success: false,

				error:
					(error as Error)?.message ||
					'Authentication failed',
			};
		}
	}

	async getPressList(
		token: string
	): Promise<
		ApiResponse<PressItem[]>
	> {
		const result =
			await this.request<
				PressItem[]
			>(
				`${PRESS_ENDPOINT}?visibility=public,private,protected,prime`,
				'GET',
				token
			);

		return result;
	}

	async getMarketList(
		token: string
	): Promise<
		ApiResponse<ProductItem[]>
	> {
		return this.request<
			ProductItem[]
		>(
			MARKET_ENDPOINT,
			'GET',
			token
		);
	}

	async getPressDetail(
		token: string,
		id: string
	): Promise<
		ApiResponse<PressDetailItem>
	> {
		const result =
			await this.request<
				PressDetailItem
			>(
				`${PRESS_ENDPOINT}/${id}`,
				'GET',
				token
			);

		return result;
	}

	async getProduct(
		token: string,
		id: string
	): Promise<ApiResponse<unknown>> {
		const result =
			await this.request(
				`${MARKET_ENDPOINT}/${id}`,
				'GET',
				token
			);

		return result;
	}

	async uploadPress(
		token: string,
		formData: FormData
	): Promise<ApiResponse<unknown>> {
		const { body, contentType } =
			await serializeFormData(
				formData
			);

		return this.request(
			PRESS_ENDPOINT,
			'POST',
			token,
			body,
			{ 'Content-Type': contentType }
		);
	}

	async uploadProduct(
		token: string,
		formData: FormData
	): Promise<ApiResponse<unknown>> {
		const { body, contentType } =
			await serializeFormData(
				formData
			);

		return this.request(
			MARKET_ENDPOINT,
			'POST',
			token,
			body,
			{ 'Content-Type': contentType }
		);
	}

	async removePress(
		token: string,
		id: string
	): Promise<ApiResponse<unknown>> {
		return this.request(
			`${PRESS_ENDPOINT}/${id}`,
			'DELETE',
			token
		);
	}

	async removeProduct(
		token: string,
		id: string
	): Promise<ApiResponse<unknown>> {
		return this.request(
			`${MARKET_ENDPOINT}/${id}`,
			'DELETE',
			token
		);
	}
}
