// 168 种世界各地美食名称
export const CUISINES = [
  // 亚洲美食 (70种)
  'Ramen', 'Sushi', 'Tempura', 'Yakitori', 'Udon', 'Soba', 'Takoyaki', 'Okonomiyaki',
  'Tonkatsu', 'Teriyaki', 'Miso Soup', 'Onigiri', 'Gyoza', 'Edamame', 'Katsudon',
  'Bibimbap', 'Kimchi', 'Bulgogi', 'Japchae', 'Tteokbokki', 'Samgyeopsal', 'Gimbap',
  'Kung Pao Chicken', 'Mapo Tofu', 'Peking Duck', 'Hot Pot', 'Dim Sum', 'Spring Roll',
  'Fried Rice', 'Dumplings', 'Wonton', 'Chow Mein', 'Sweet and Sour Pork', 'Xiaolongbao',
  'Pad Thai', 'Tom Yum', 'Green Curry', 'Massaman Curry', 'Som Tam', 'Satay',
  'Pho', 'Banh Mi', 'Bun Cha', 'Goi Cuon', 'Cao Lau',
  'Nasi Goreng', 'Rendang', 'Satay', 'Gado-Gado', 'Soto',
  'Biryani', 'Tandoori Chicken', 'Butter Chicken', 'Palak Paneer', 'Samosa',
  'Naan', 'Curry', 'Tikka Masala', 'Dosa', 'Idli',
  'Kebab', 'Shawarma', 'Hummus', 'Falafel', 'Tabouleh',
  'Laksa', 'Char Kway Teow', 'Hainanese Chicken Rice', 'Chili Crab', 'Rojak',
  
  // 欧洲美食 (50种)
  'Pizza', 'Pasta', 'Lasagna', 'Risotto', 'Carbonara', 'Tiramisu', 'Gelato', 'Bruschetta',
  'Caprese', 'Ravioli', 'Gnocchi', 'Osso Buco', 'Panna Cotta', 'Cannoli',
  'Paella', 'Tapas', 'Gazpacho', 'Churros', 'Tortilla Española', 'Jamón Ibérico',
  'Croissant', 'Baguette', 'Crêpe', 'Quiche', 'Ratatouille', 'Bouillabaisse',
  'Coq au Vin', 'Crème Brûlée', 'Macaron', 'Escargot',
  'Fish and Chips', 'Shepherd\'s Pie', 'Bangers and Mash', 'Yorkshire Pudding', 'Scone',
  'Bratwurst', 'Sauerkraut', 'Schnitzel', 'Pretzel', 'Black Forest Cake',
  'Moussaka', 'Souvlaki', 'Tzatziki', 'Baklava', 'Spanakopita',
  'Pierogi', 'Borscht', 'Goulash', 'Stroganoff', 'Blini',
  
  // 美洲美食 (30种)
  'Hamburger', 'Hot Dog', 'BBQ Ribs', 'Mac and Cheese', 'Fried Chicken',
  'Buffalo Wings', 'Clam Chowder', 'Philly Cheesesteak', 'Pancake', 'Waffle',
  'Apple Pie', 'Brownie', 'Cheesecake', 'Donut', 'Bagel',
  'Tacos', 'Burritos', 'Quesadilla', 'Enchilada', 'Nachos',
  'Guacamole', 'Ceviche', 'Empanada', 'Churrasco', 'Feijoada',
  'Arepas', 'Poutine', 'Pulled Pork', 'Cornbread', 'Jambalaya',
  
  // 非洲与其他 (18种)
  'Couscous', 'Tagine', 'Injera', 'Jollof Rice', 'Bobotie',
  'Bunny Chow', 'Peri-Peri Chicken', 'Biltong', 'Boerewors',
  'Meat Pie', 'Pavlova', 'Lamington', 'Tim Tam', 'Vegemite Toast',
  'Fish Tacos', 'Crab Cakes', 'Lobster Roll', 'Clam Bake',
];

// 确保正好 168 种
if (CUISINES.length !== 168) {
  console.warn(`Warning: Expected 168 cuisines, but got ${CUISINES.length}`);
}

export const getCuisineCount = () => CUISINES.length;

