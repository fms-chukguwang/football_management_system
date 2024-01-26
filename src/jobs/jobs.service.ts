import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { LocationModel } from '../location/entities/location.entity';
import { SoccerField } from '../match/entities/soccer-field.entity';
import { Repository } from 'typeorm';
import { parseString } from 'xml2js';

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


@Injectable()
export class JobsService {

    constructor(
        @InjectRepository(LocationModel)
        private readonly locationRepository: Repository<LocationModel>,

        @InjectRepository(SoccerField)
        private soccerFieldRepository: Repository<SoccerField>,
    ) {}

    async fetchDataAndProcess(): Promise<void> {
        const url = `http://openapi.seoul.go.kr:8088/${process.env.SEOUL_FIELD_API_KEY}/xml/ListPublicReservationSport/1/1000/축구장`;
    
        try {
          const response = await axios.get(url);
          const result = await this.parseXml<ListPublicReservationSportResponse>(response.data);
          const rows = result.ListPublicReservationSport.row;
          const queries = [];
          const processedAddresses = new Set(); 
    
          for (const item of rows) {
            // 주소 가져오기 및 처리
            const address = await this.getAddressFromCoordinates(parseFloat(item.Y[0]), parseFloat(item.X[0]));

            // 이미 처리된 주소인 경우 건너뛰기
            if (processedAddresses.has(address)) {
                continue;
            }

            processedAddresses.add(address); // 주소를 처리된 주소 Set에 추가
            const addressParts = address.split(' ');

            // 데이터베이스에 저장하는 로직 구현...
            await this.saveLocationAndSoccerField(item, address);
          }
        } catch (error) {
          console.error(error);
        }
      }
    
      private parseXml<T>(xml: string): Promise<T> {
        return new Promise((resolve, reject) => {
          parseString(xml, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      }
    
      private async saveLocationAndSoccerField(item: SportField, address: string): Promise<void> {
        // 주소 분해
        const addressParts = address.split(' ');

        // 위치 검색 또는 새로 생성
        let location = await this.locationRepository.findOne({ where:{address} });
        if (!location) {
            location = this.locationRepository.create({
                state: addressParts[0],
                city: addressParts[1],
                district: addressParts[2],
                address: address
            });
            await this.locationRepository.save(location);
        }

        // 축구장 검색 또는 새로 생성
        let soccerField = await this.soccerFieldRepository.findOne({

            where: { 
                    location_id: location.id , 
                    field_name: item.PLACENM[0] 
                },
        });

        if (!soccerField) {
            soccerField = this.soccerFieldRepository.create({
                location_id: location.id,
                field_name: item.PLACENM[0],
                image_url: item.IMGURL[0],
                district: item.AREANM[0],
                phone_number: item.TELNO[0],
                x_coord: parseFloat(item.X[0]),
                y_coord: parseFloat(item.Y[0])
            });
            await this.soccerFieldRepository.save(soccerField);
        } else {
            // 이미 존재하는 축구장 정보를 업데이트할 수도 있습니다.
            // 예: soccerField.someField = newValue;
            // await this.soccerFieldRepository.save(soccerField);
        }
    }

      async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
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
    
}
