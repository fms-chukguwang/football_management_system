import axios from 'axios';
import { config } from 'dotenv';

// 환경 변수 파일(.env)을 로드
config();

export async function getAddressFromCoordinates(latitude, longitude) {
    const apiKey = process.env.KAKAO_API_KEY; // 카카오 REST API 키
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `KakaoAK ${apiKey}` }
        });
        if (response.data.documents.length > 0) {
            // 첫 번째 결과의 주소를 반환합니다.
            return response.data.documents[0].address.address_name;
        } else {
            throw new Error('주소를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error fetching address: ', error);
        throw error;
    }
}
