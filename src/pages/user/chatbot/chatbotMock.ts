/*
  알파카 임시 답변
  현재는 백엔드 연결 전이므로
  Mock 형태로 답변
  추후 axios API 요청으로 변경할 예정
*/
export const getMockAnswer = (
    question: string
) => {
    if (question.includes('요금')) {
        return '주차 요금에 대해 안내해드릴게요. 현재는 테스트 답변이며 추후 실제 주차 정책 데이터를 기반으로 안내할 예정입니다.';
    }
    if (question.includes('예약')) {
        return '주차 예약에 대해 안내해드릴게요. 원하는 날짜와 시간의 주차 예약 정보를 확인할 수 있습니다.';
    }
    if (question.includes('이용')) {
        return '주차장 이용 방법에 대해 안내해드릴게요. 현재는 테스트 답변이며 추후 주차 이용 정책과 연동할 예정입니다.';
    }
    return '문의하신 내용을 확인했습니다. 현재는 테스트 단계이며 추후 AI와 주차 관련 데이터를 연결하여 답변할 예정입니다.';
};