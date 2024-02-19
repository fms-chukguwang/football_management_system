import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { JobsService } from 'src/jobs/jobs.service';

describe('TaskService', () => {
    let service: TaskService;
    let jobService: JobsService;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TaskService,
                {
                    provide: JobsService,
                    useValue: {
                        fetchDataAndProcess: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TaskService>(TaskService);
        jobService = module.get<JobsService>(JobsService);
    });

    it('handleCron', () => {
        service.handleCron();
        expect(jobService.fetchDataAndProcess).toHaveBeenCalled();
    });
});
