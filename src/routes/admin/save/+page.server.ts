import { adminDB } from '$lib/server/firebase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { slugify } from '$lib/utils';
import { FieldValue } from 'firebase-admin/firestore';

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        
        // 1. Lấy dữ liệu từ Form
        const keyword = formData.get('keyword') as string;
        const country = 'us';
        
        // Các trường JSON (Dạng chuỗi)
        const seedingTargetsStr = formData.get('seeding_targets') as string;
        const alternativesStr = formData.get('alternatives') as string;
        const processedAppsStr = formData.get('processed_apps') as string;
        const marketReportStr = formData.get('market_report') as string;
        const rawResponseStr = formData.get('raw_response') as string; // Optional: lưu lại để debug sau này

        // 2. Validate cơ bản
        if (!keyword) {
            return fail(400, { error: 'Thiếu Keyword!', missing: true });
        }

        // Helper: Validate JSON String (để đảm bảo mày không paste thiếu dấu ngoặc)
        const validateJSON = (str: string, fieldName: string) => {
            if (!str || str.trim() === '') return null; // Cho phép rỗng
            try {
                // Thử parse, nếu ok thì trả về string đã được minify (bỏ khoảng trắng thừa) cho nhẹ DB
                // Hoặc giữ nguyên format nếu muốn dễ đọc trên Console
                const obj = JSON.parse(str); 
                return JSON.stringify(obj); 
            } catch (e) {
                throw new Error(`JSON lỗi ở trường: ${fieldName}`);
            }
        };

        try {
            // 3. Chuẩn bị data để save

            const slug = slugify(keyword);
            const docId = `${slug}`;

            const dataToSave: any = {
                keyword: keyword,
                slug: slug,
                country: country.toLowerCase(),
                created_at: FieldValue.serverTimestamp(), // Tự động lấy giờ server
                updated_at: FieldValue.serverTimestamp(),
            };

            // Validate và nhét vào object
            if (seedingTargetsStr) dataToSave.seeding_targets = validateJSON(seedingTargetsStr, 'Seeding Targets');
            if (alternativesStr) dataToSave.alternatives = validateJSON(alternativesStr, 'Alternatives');
            if (processedAppsStr) dataToSave.processed_apps = validateJSON(processedAppsStr, 'Processed Apps');
            if (marketReportStr) dataToSave.market_report = validateJSON(marketReportStr, 'Market Report');
            if (rawResponseStr) dataToSave.raw_response = validateJSON(rawResponseStr, 'Raw Response');

            // 4. Ghi vào Firestore (Dùng set với merge: true để update nếu đã có, hoặc tạo mới)
            await adminDB.collection('analysis').doc(docId).set(dataToSave, { merge: true });

            return { success: true, message: `Đã lưu thành công: ${keyword}` };

        } catch (error: any) {
            console.error('Save Error:', error);
            return fail(500, { error: error.message });
        }
    }
};
