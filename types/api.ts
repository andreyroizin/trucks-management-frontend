export type LoginData = {
    token: string;
};

export type LoginResponse = {
    isSuccess: boolean;
    statusCode: number;
    data: LoginData | null;
    errors: string[] | null;
};
