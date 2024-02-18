import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationModel } from '../location/entities/location.entity';
import { SoccerField } from '../match/entities/soccer-field.entity';
import axios from 'axios';
import * as xml2js from 'xml2js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JobsService', () => {
  let service: JobsService;
  let consoleSpy: jest.SpyInstance;
  let locationRepositoryMock: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let soccerFieldRepositoryMock: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    locationRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    soccerFieldRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(LocationModel), useValue: locationRepositoryMock },
        { provide: getRepositoryToken(SoccerField), useValue: soccerFieldRepositoryMock },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchDataAndProcess', () => {

    it('fetchDataAndProcess 데이터 성공적으로 가져온다', async () => {
      // Mock API response
      const mockApiResponse = {
        data: "<ListPublicReservationSport><row><PLACENM>축구장1</PLACENM><Y>37.5665</Y><X>126.9780</X></row></ListPublicReservationSport>",
      };
      mockedAxios.get.mockResolvedValue(mockApiResponse);
  
      // Mock XML parsing
      jest.spyOn(xml2js, 'parseString').mockImplementation((xml, callback) => {
        callback(null, {
          ListPublicReservationSport: {
            row: [{
              PLACENM: ['축구장1'],
              IMGURL: ['이미지URL'],
              AREANM: ['지역명'],
              TELNO: ['전화번호'],
              X: ['126.9780'],
              Y: ['37.5665'],
            }],
          },
        });
      });
  
      // Mock getAddressFromCoordinates
      jest.spyOn(service, 'getAddressFromCoordinates').mockResolvedValue('서울특별시 중구 세종대로 110');
  
      // Mock saveLocationAndSoccerField
      jest.spyOn(service, 'saveLocationAndSoccerField').mockResolvedValue();
  
      await service.fetchDataAndProcess();
  
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("http://openapi.seoul.go.kr:8088/"));
      expect(service.getAddressFromCoordinates).toHaveBeenCalledWith(37.5665, 126.9780);
      expect(service.saveLocationAndSoccerField).toHaveBeenCalled();
    });
  
    it('fetchDataAndProcess 에러 처리', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
  
      await expect(service.fetchDataAndProcess()).resolves.not.toThrow();
  
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

  });

  describe('parseXml', () => {
    it('should correctly parse XML string to JSON', async () => {
      const xml = `<root><test>value</test></root>`;
      const expectedResult = { root: { test: ['value'] } };

      (xml2js.parseString as jest.Mock).mockImplementation((xmlStr, callback) => {
        callback(null, expectedResult);
      });

      const result = await service.parseXml(xml);
      expect(result).toEqual(expectedResult);
      expect(xml2js.parseString).toHaveBeenCalledWith(xml, expect.any(Function));
    });

    it('should handle parsing errors', async () => {
      const xml = `<root><test>value</test></root>`;
      const error = new Error('Parsing error');

      (xml2js.parseString as jest.Mock).mockImplementation((xmlStr, callback) => {
        callback(error, null);
      });

      await expect(service.parseXml(xml)).rejects.toThrow(error);
    });
  });
  
  describe('getAddressFromCoordinates', () => {
    it('위도와 경도를 바탕으로 주소를 성공적으로 가져와야 한다', async () => {
      const latitude = 37.5665;
      const longitude = 126.9780;
      const mockResponse = {
        data: {
          documents: [
            {
              address: {
                address_name: '서울특별시 중구 세종대로 110',
              },
            },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);
  
      const result = await service.getAddressFromCoordinates(latitude, longitude);
  
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("https://dapi.kakao.com/v2/local/geo/coord2address.json"), expect.any(Object));
      expect(result).toBe('서울특별시 중구 세종대로 110');
    });
  
    it('주소를 찾을 수 없는 경우 에러를 던져야 한다', async () => {
      const latitude = 0;
      const longitude = 0;
      const mockResponse = { data: { documents: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);
  
      await expect(service.getAddressFromCoordinates(latitude, longitude)).rejects.toThrow('주소를 찾을 수 없습니다.');
  
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("https://dapi.kakao.com/v2/local/geo/coord2address.json"), expect.any(Object));
    });
  
    it('API 호출 중 에러가 발생한 경우 에러를 던져야 한다', async () => {
      const latitude = 37.5665;
      const longitude = 126.9780;
      const errorMessage = 'API 호출 실패';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));
  
      await expect(service.getAddressFromCoordinates(latitude, longitude)).rejects.toThrow(Error);
  
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("https://dapi.kakao.com/v2/local/geo/coord2address.json"), expect.any(Object));
    });
  });
  

  // Additional tests can be added here
});
