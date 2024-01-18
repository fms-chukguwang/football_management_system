import { ValidationArguments } from 'class-validator';

export const stringValidationMessage = (args: ValidationArguments) => {
    return `${args.property}는 문자로 입력해야합니다.`;
};
