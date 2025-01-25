export type LoginData = {
    token: string;
};

export type LoginResponse = {
    isSuccess: boolean;
    statusCode: number;
    data: LoginData | null;
    errors: string[] | null;
};

export type ApiResponse<T> = {
    isSuccess: boolean;
    statusCode: number;
    data: T;
    errors: string[] | null;
};

export type User = {
    id: string;
    name: string;
    email: string;
};

export type Company = {
    id: string;
    name: string;
};

export type Role = {
    id: string;
    name: string;
};

export type ResetPasswordPayload = {
    email: string | null;
    token: string | null;
    newPassword: string;
    confirmPassword: string;
};

export type ChangePasswordPayload = {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};
