export const parseJwt = (token: string) => {
    // console.log("parseJwt.ts token =>"+token);
    try {
      // payLoad는 배열에서 1번째에 해당이 된다.
      const payLoad = token.split('.')[1];
      // console.log(`payLoad : ${payLoad}`);
      

      const jsonPayload = decodeURIComponent(
        atob(payLoad)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      // console.log(`jsonPayload : ${jsonPayload}`);
      // console.log(`JSON.parse(jsonPayload):${JSON.parse(jsonPayload).sub}, Role: ${JSON.parse(jsonPayload).role}`);
      // console.log("*************payLoad*******************");
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };