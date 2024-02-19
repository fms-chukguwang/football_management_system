import { Test } from '@nestjs/testing';
import { MemberService } from './member.service';
import { Member } from './entities/member.entity';
import { NotFoundException } from '@nestjs/common';

describe('MemberService', () => {
  let memberService: MemberService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MemberService],
    }).compile();

    memberService = moduleRef.get<MemberService>(MemberService);
  });

  describe('findAllPlayers', () => {
    it('should return all players', async () => {
      // Given
      const expectedPlayers: Member[] = [/* mock players */];
      jest.spyOn(memberService['memberRepository'], 'find').mockResolvedValue(expectedPlayers);

      // When
      const actualPlayers = await memberService.findAllPlayers();

      // Then
      expect(actualPlayers).toEqual(expectedPlayers);
    });

    it('should throw NotFoundException if no players found', async () => {
      // Given
      jest.spyOn(memberService['memberRepository'], 'find').mockResolvedValue([]);

      // When
      const findPlayers = memberService.findAllPlayers();

      // Then
      await expect(findPlayers).rejects.toThrowError(NotFoundException);
    });
  });
});
