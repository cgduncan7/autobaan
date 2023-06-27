import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface CustomResponse<T = unknown> {
	data: T
}

@Injectable()
export class CustomResponseTransformInterceptor<T>
	implements NestInterceptor<T, CustomResponse<T>>
{
	intercept(
		_context: ExecutionContext,
		next: CallHandler,
	): Observable<CustomResponse<T>> {
		return next.handle().pipe(map((data) => ({ data })))
	}
}
