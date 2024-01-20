class ErrorCodeVo {
    readonly status;
    readonly message;

    constructor(status: number, message: string) {
        this.status = status;
        this.message = message;
    }
}

export type ErorrType = ErrorCodeVo;

export const EMPTY_NOT_FOUND = new ErrorCodeVo(400, '찾을수 없습니다');
