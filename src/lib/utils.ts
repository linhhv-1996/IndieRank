export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Thay khoảng trắng bằng -
        .replace(/[^\w\-]+/g, '') // Bỏ ký tự đặc biệt
        .replace(/\-\-+/g, '-');  // Bỏ dấu - trùng lặp
}
