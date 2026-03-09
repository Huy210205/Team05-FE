// Nếu file đã tồn tại, chỉ cần thêm/export kiểu này:
export type ProfileDto = {
    sub: string;
    email: string;
    preferred_username: string;
    name?: string | null;
    iat: string; // BE đang trả ISO string
    exp: string; // BE đang trả ISO string
};
