import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  InjectRepository,
  ArangoRepository,
  ResultList,
  ArangoNewOldResult,
} from 'nest-arango';
import { aql, Database } from 'arangojs';
import { UserEntity } from './entities/user.entity';

const db = new Database({
  url: 'http://localhost:8529',
  databaseName: '_system',
  auth: {
    username: 'root',
    password: 'azim1383',
  },
});

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: ArangoRepository<UserEntity>,
  ) {}

  async createUser(
    user: UserEntity,
    currentUserEmail: string,
  ): Promise<UserEntity> {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);

    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can add new user!');
    }

    await db.query(aql`
    FOR u IN users
      FILTER u.email == ${user.email}
      LIMIT 1
      THROW { "errorCode": 403, "errorMessage": "This email already exists" }
  
    FOR u IN users
      FILTER u.username == ${user.username}
      LIMIT 1
      THROW { "errorCode": 403, "errorMessage": "This username already exists" }
    `);

    user.role = 'USER';
    user.userTaskIds = [];
    return await this.userRepository.save(user);
  }

  async findAllUsers(
    role?: 'USER' | 'SUB_ADMIN' | 'ADMIN',
  ): Promise<ResultList<UserEntity>> {
    if (role) {
      const rolesArray = this.userRepository.findManyBy({ role });
      if ((await rolesArray).results.length === 0) {
        throw new NotFoundException('Role Not Found');
      }
      return rolesArray;
    }

    return await this.userRepository.findAll();
  }

  async changePassword(currentUserEmail: string, oldPassword: string, newPassword: string) {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);

    if (currentUser.password !== oldPassword) {
      throw new ForbiddenException('You entered your old password incorrectly!');
    }

    if (newPassword === oldPassword) {
      throw new ForbiddenException('This is your current password.');
    }

    return this.updateUser(currentUser.username, { "password": newPassword });
  }

  async increaseRole(currentUserEmail: string, selectedUserUsername: string) {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can increase users roles');
    }

    const wantedUser = await this.findOneUserByUsername(selectedUserUsername);
    if (!wantedUser) {
      throw new NotFoundException("User Not Found");
    }

    if (wantedUser.role !== 'USER') {
      throw new ForbiddenException("this user's role is already SUB ADMIN");
    }
    
    return this.updateUser(currentUser.username, { role: 'SUB_ADMIN' });
  }

  async decreaseRole(currentUserEmail: string, selectedUserUsername: string) {
    const currentUser = await this.findOneUserByEmail(currentUserEmail);
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('only admin can decrease sub admins roles');
    }

    const wantedUser = this.findOneUserByUsername(selectedUserUsername);
    if (!wantedUser) {
      throw new NotFoundException("User Not Found");
    }

    if ((await wantedUser).role !== 'SUB_ADMIN') {
      throw new ForbiddenException("this user's role is already USER");
    }
    
    return this.updateUser(currentUser.username, { role: 'SUB_ADMIN' });
  }

  async findOneUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findOneUserByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ username });
  }

  async findOneUserById(_id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ _id });
  }

  async updateUser(
    username: string,
    updatedUser: Partial<UserEntity>,
  ): Promise<ArangoNewOldResult<UserEntity>> {
    // checking user existance
    const existingUser = await this.userRepository.findOneBy({ username });
    if (!existingUser) {
      throw new NotFoundException('user not found');
    }

    // updating wanted user field
    Object.assign(existingUser, updatedUser);

    // applying update to user field in database
    const updatedDocument = await this.userRepository.update(existingUser);

    return updatedDocument ? updatedDocument : null;
  }

  async removeUser(username: string): Promise<void> {
    await this.userRepository.removeBy({ username });
  }

  async userAccessHandleError(
    message: string,
    currentUser: UserEntity,
    wantedUser: UserEntity,
  ) {
    if (currentUser.role !== 'ADMIN') {
      if (currentUser.role !== 'SUB_ADMIN' || wantedUser.role !== 'USER') {
        throw new ForbiddenException(message);
      }
    }
  }
}
