import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @MaxLength(32, { message: 'Tên đăng nhập tối đa 32 ký tự' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang',
  })
  username: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(120)
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu tối đa 128 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;
}

export class LoginDto {
  @IsString()
  @MaxLength(120)
  username: string; // Chấp nhận username hoặc email

  @IsString()
  @MaxLength(128)
  password: string;
}

export class UpdateProfileAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  displayName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu mới tối đa 128 ký tự' })
  newPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}
