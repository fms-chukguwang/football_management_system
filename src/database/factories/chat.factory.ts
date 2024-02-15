import { Chats } from '../../chats/entities/chats.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Chats, (faker) => {
    const chat = new Chats();
    chat.createdAt = new Date();
    chat.updatedAt = new Date();
    chat.deletedAt = null;
    return chat;
});
