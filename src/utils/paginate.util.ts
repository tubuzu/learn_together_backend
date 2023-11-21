export function paginate(array: any, page: number, perPage: number) {
  // Tính toán chỉ số bắt đầu và kết thúc của phần mảng
  const start = (page - 1) * perPage;
  const end = start + perPage;

  // Trả về phần mảng được cắt theo chỉ số
  return array.slice(start, end);
}
