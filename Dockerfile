# Sử dụng Node.js làm base image để build ứng dụng
FROM node:16 AS builder

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependency
RUN npm install

# Sao chép mã nguồn của ứng dụng vào container
COPY . .

# Build ứng dụng React
RUN npm run build

# Sử dụng Node.js làm môi trường chạy ứng dụng
FROM node:16

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép build từ giai đoạn trước sang thư mục làm việc
COPY --from=builder /app/build /app/build

# Cài đặt các dependency của server (nếu có)
COPY package*.json ./
RUN npm install

# Expose cổng 3000
EXPOSE 3000

# Khởi chạy ứng dụng React (Start server ở chế độ phát triển)
CMD ["npm", "start"]
