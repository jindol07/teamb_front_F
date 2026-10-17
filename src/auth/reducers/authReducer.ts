//login/reducers/authReducer.ts
import {  createSlice, PayloadAction } from '@reduxjs/toolkit';
// 어떤 상태를 관리할지 정의하는 인터페이스
interface AuthState {
  username: string;
  token: string;
  error: string | null;
}
// 상태의 초기값 설정
const initialState: AuthState = {
  username: '',
  token: '',
  error: null
};
// 상태 조각을 관리하는 슬라이스 생성
const authSlice = createSlice({
// 이게 상태 조각의 이름
  name: 'auth',
  // 초기 상태 -   auth 조각의 초기 상태
  initialState,
  // 상태를 변경하는 리듀서 함수들  - auth 조각을 관리하는 함수들
  reducers: {
    loginSuccess(state, action: PayloadAction<{ username: string; token: string }>) {
      state.username = action.payload.username;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    logout(state) {
      state.username = '';
      state.token = '';
      state.error = null;
    }
  }
});
// 액션 생성자 내보내기
export const { loginSuccess, loginFailure, logout } = authSlice.actions;
// 리듀서 내보내기
// 슬라이스에서 생성된 리듀서를 기본 내보내기로 내보낸다.
export default authSlice.reducer;