
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Vercel build sẽ xử lý import từ thư mục gốc
import type { StudentData } from '../types';

const STORAGE_KEY = 'student_survey_data_prod_v1';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Cho phép CORS từ mọi nguồn, cần thiết để API hoạt động khi gọi từ frontend
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Xử lý yêu cầu pre-flight của CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'GET') {
    try {
      const data = await kv.get<StudentData[]>(STORAGE_KEY);
      // Nếu không có dữ liệu, trả về một mảng rỗng
      return response.status(200).json(data || []);
    } catch (error: any) {
      console.error('KV GET Error:', error);
      return response.status(500).json({ message: 'Failed to retrieve data.', error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const newSubmission = request.body as StudentData;

      // Validate dữ liệu đầu vào cơ bản
      if (!newSubmission || !newSubmission.id || !newSubmission.fullName) {
          return response.status(400).json({ message: 'Invalid submission data.' });
      }

      const existingData = (await kv.get<StudentData[]>(STORAGE_KEY)) || [];
      const updatedData = [...existingData, newSubmission];
      
      await kv.set(STORAGE_KEY, updatedData);
      
      return response.status(201).json({ message: 'Data saved successfully.' });
    } catch (error: any) {
      console.error('KV SET Error:', error);
      return response.status(500).json({ message: 'Failed to save data.', error: error.message });
    }
  }

  // Xử lý các phương thức HTTP không được hỗ trợ
  response.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  return response.status(405).end(`Method ${request.method} Not Allowed`);
}
