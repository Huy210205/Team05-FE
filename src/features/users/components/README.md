# User Management Components

## CreateUserModal

Component modal để tạo người dùng mới với giao diện đẹp theo thiết kế.

### Features

- **Thông tin cơ bản**: Họ tên, email, số điện thoại, ngày sinh, giới tính, CMND/CCCD
- **Vai trò và trung tâm**: Hỗ trợ thêm nhiều vai trò cho một người dùng
- **Thông tin công việc**: Ngày bắt đầu, chuyên môn, kinh nghiệm
- **Địa chỉ & thông tin khác**: Địa chỉ chi tiết, trình độ học vấn, ghi chú

### Props

```typescript
interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
}
```

### Usage

```tsx
import CreateUserModal from './CreateUserModal';

<CreateUserModal
    open={isOpen}
    onClose={() => setIsOpen(false)}
    onSubmit={(userData) => {
        // Handle user creation
        console.log('New user data:', userData);
    }}
/>;
```

### Styling

Component sử dụng Tailwind CSS với các màu sắc và styling phù hợp với thiết kế:

- Background: `#f3f3f5` cho input fields
- Primary button: `#030213`
- Text colors: `#717182` cho placeholder, `#1e2939` cho text chính
- Border radius: `rounded-lg`, `rounded-xl` cho các container
