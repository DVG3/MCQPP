import os

def list_files_in_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            full_path = os.path.join(root, file)
            # Thay thế dấu "\" thành "/" để đồng nhất định dạng (trên Windows)
            formatted_path = full_path.replace("\\", "/")
            formatted_path= formatted_path.split('/')
            formatted_path = formatted_path[formatted_path.index("AllTests") + 1:]
            print(f'"{'/'.join(formatted_path)}",')

# Thư mục gốc cần đọc (ở đây là "A")
root_directory = "D:\Programming\Projects\MCQpp\AllTests"

# Gọi hàm để liệt kê tất cả các file
list_files_in_directory(root_directory)