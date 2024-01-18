import { HttpStatus } from '@nestjs/common';

interface ReturnSuccess {
    status: HttpStatus;
    success: boolean;
}

export const RETURN_SUCCESS_OBJECT1: ReturnSuccess = {
    status: HttpStatus.OK,
    success: true,
};
