import axios from 'axios';
import { parseString } from 'xml2js';
import { getAddressFromCoordinates } from './coordToAddr.js';
import { config } from 'dotenv';
import mysql from 'mysql';

// 환경 변수 파일(.env)을 로드
config();

console.log(`?????????????`);
interface SportField {
    PLACENM: string[];
    IMGURL: string[];
    AREANM: string[];
    TELNO: string[];
    X: string[];
    Y: string[];
  }
  
  interface ListPublicReservationSportResponse {
    ListPublicReservationSport: {
      row: SportField[];
    };
  }

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  // 데이터베이스 연결
  db.connect(err => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to database.');
  });

const url = `http://openapi.seoul.go.kr:8088/${process.env.SEOUL_FIELD_API_KEY}/xml/ListPublicReservationSport/1/1000/축구장`;

axios.get(url)
    .then(response => {
        const xml = response.data;

        // const parseXml = xml => {
        //     return new Promise((resolve, reject) => {
        //         parseString(xml, (err, result) => {
        //             if (err) reject(err);
        //             else resolve(result);
        //         });
        //     });
        // };

        const parseXml = <T>(xml: string): Promise<T> => {
            return new Promise((resolve, reject) => {
              parseString(xml, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
          };

        return parseXml<ListPublicReservationSportResponse>(xml); // XML 파싱 Promise 반환
    })
    .then(async result => {
        const rows = result.ListPublicReservationSport.row;
        const queries = [];
        const processedAddresses = new Set(); // 처리된 주소를 추적하기 위한 Set

        for (const item of rows) {
            const address = await getAddressFromCoordinates(item.Y[0], item.X[0]);

            // 이미 처리된 주소인 경우 건너뛰기
            if (processedAddresses.has(address)) {
                continue;
            }

            processedAddresses.add(address); // 주소를 처리된 주소 Set에 추가
            const addressParts = address.split(' ');
            console.log(`addressParts ${addressParts}`);
            // 주소 처리 및 soccer_fields 테이블에 정보 삽입
            const queryPromise = new Promise<void>((resolve, reject) => {
                const checkQuery = 'SELECT * FROM location WHERE address = ?';
                db.query(checkQuery, [address], (err, results) => {
                    if (err) reject(err);

                    let locationId;
                    if (results.length === 0) {
                        // location 테이블에 새 주소 삽입
                        const insertLocationQuery = 'INSERT INTO location (state, city, district, address) VALUES (?, ?, ?, ?)';
                        db.query(insertLocationQuery, [addressParts[0], addressParts[1], addressParts[2], address], (err, results) => {
                            if (err) reject(err);
                            locationId = results.insertId; // 새로 삽입된 주소의 ID
                            insertSoccerFields(locationId);
                        });
                    } else {
                        locationId = results[0].id; // 기존 주소의 ID
                        insertSoccerFields(locationId);
                    }

                    function insertSoccerFields(locationId) {
                        // soccer_fields 테이블에서 locationId로 데이터가 있는지 확인
                        const checkSoccerFieldQuery = 'SELECT * FROM soccer_fields WHERE location_id = ?';
                        db.query(checkSoccerFieldQuery, [locationId], (err, results) => {
                            if (err) reject(err);
                    
                            if (results.length === 0) {
                                // soccer_fields 테이블에 해당 locationId가 없으면 새로운 데이터 삽입
                                const insertSoccerFieldsQuery = 'INSERT INTO soccer_fields (location_id, field_name, image_url, district, phone_number, x_coord, y_coord) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                db.query(insertSoccerFieldsQuery, [locationId, item.PLACENM[0], item.IMGURL[0], item.AREANM[0], item.TELNO[0], item.X[0], item.Y[0]], (err, results) => {
                                    if (err) reject(err);
                                    console.log(`New soccer field inserted for location ID ${locationId}: ${item.PLACENM[0]}`);
                                    resolve();
                                });
                            } else {
                                // 이미 존재하는 경우, 삽입하지 않고 넘어감
                                console.log(`Soccer field already exists for location ID ${locationId}. Skipping insertion.`);
                                resolve();
                            }
                        });
                    }
                });
            });

            queries.push(queryPromise);
        }

        // 모든 쿼리가 완료될 때까지 기다린 후 연결 종료
        return Promise.all(queries);
    })
    .then(() => {
        console.log('End to database.');
        db.end(); // 모든 작업 후 데이터베이스 연결 종료
    })
    .catch(error => {
        console.error(error);
        db.end(); // 에러 발생 시에도 연결 종료
    });