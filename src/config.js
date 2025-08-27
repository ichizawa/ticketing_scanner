// export const BASE_URL = 'http://192.82.55.198:2223/api/';
export const BASE_URL = 'https://mediaonetix.com/api/';
// export const BASE_URL = 'http://192.168.110.116:8000/api/';

export const processResponse = async (response) => {
    try {
        const statusCode = response.status;                 //
        const data = response.json();                       //
        const res = await Promise.all([statusCode, data]);  //
        return ({                                           // get response from api
            statusCode: res[0],                             //
            data: res[1],                                   //
        });
    } catch (e) {
        console.log(e);
    }
}