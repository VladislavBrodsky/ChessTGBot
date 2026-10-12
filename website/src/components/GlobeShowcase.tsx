"use client";

import { useEffect, useState, useRef } from "react";
import { Globe } from "./magicui/globe";
import { Icon } from "@/icons";

// ── 200 global live match combinations ──────────────────────────────────────
const LIVE_MATCHES = [
  // Micro stakes – Bullet
  { p1: "Dubai", flag1: "🇦🇪", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Tokyo", flag1: "🇯🇵", p2: "Seoul", flag2: "🇰🇷", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Berlin", flag1: "🇩🇪", p2: "Paris", flag2: "🇫🇷", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Mumbai", flag1: "🇮🇳", p2: "Singapore", flag2: "🇸🇬", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Lagos", flag1: "🇳🇬", p2: "Nairobi", flag2: "🇰🇪", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Warsaw", flag1: "🇵🇱", p2: "Prague", flag2: "🇨🇿", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Kyiv", flag1: "🇺🇦", p2: "Riga", flag2: "🇱🇻", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Baku", flag1: "🇦🇿", p2: "Yerevan", flag2: "🇦🇲", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Cairo", flag1: "🇪🇬", p2: "Casablanca", flag2: "🇲🇦", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Jakarta", flag1: "🇮🇩", p2: "Manila", flag2: "🇵🇭", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },

  // Small stakes – Blitz 3+0
  { p1: "New York", flag1: "🇺🇸", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Tashkent", flag1: "🇺🇿", p2: "Zurich", flag2: "🇨🇭", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "São Paulo", flag1: "🇧🇷", p2: "Buenos Aires", flag2: "🇦🇷", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Istanbul", flag1: "🇹🇷", p2: "Ankara", flag2: "🇹🇷", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Stockholm", flag1: "🇸🇪", p2: "Oslo", flag2: "🇳🇴", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Madrid", flag1: "🇪🇸", p2: "Lisbon", flag2: "🇵🇹", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Toronto", flag1: "🇨🇦", p2: "Chicago", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Sydney", flag1: "🇦🇺", p2: "Auckland", flag2: "🇳🇿", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Bangkok", flag1: "🇹🇭", p2: "Kuala Lumpur", flag2: "🇲🇾", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Helsinki", flag1: "🇫🇮", p2: "Tallinn", flag2: "🇪🇪", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },

  // Popular stakes – Blitz 5+0
  { p1: "Seoul", flag1: "🇰🇷", p2: "San Francisco", flag2: "🇺🇸", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Paris", flag1: "🇫🇷", p2: "Buenos Aires", flag2: "🇦🇷", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Moscow", flag1: "🇷🇺", p2: "Almaty", flag2: "🇰🇿", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Accra", flag1: "🇬🇭", p2: "Cape Town", flag2: "🇿🇦", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Amsterdam", flag1: "🇳🇱", p2: "Brussels", flag2: "🇧🇪", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Bangalore", flag1: "🇮🇳", p2: "Colombo", flag2: "🇱🇰", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Lima", flag1: "🇵🇪", p2: "Bogotá", flag2: "🇨🇴", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Vienna", flag1: "🇦🇹", p2: "Budapest", flag2: "🇭🇺", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Riyadh", flag1: "🇸🇦", p2: "Abu Dhabi", flag2: "🇦🇪", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Taipei", flag1: "🇹🇼", p2: "Ho Chi Minh", flag2: "🇻🇳", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },

  // Mid stakes – Rapid 10+0
  { p1: "Dubai", flag1: "🇦🇪", p2: "Singapore", flag2: "🇸🇬", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "New York", flag1: "🇺🇸", p2: "Tokyo", flag2: "🇯🇵", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "London", flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "Mumbai", flag2: "🇮🇳", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Berlin", flag1: "🇩🇪", p2: "Tashkent", flag2: "🇺🇿", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Chicago", flag1: "🇺🇸", p2: "Toronto", flag2: "🇨🇦", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Barcelona", flag1: "🇪🇸", p2: "Rome", flag2: "🇮🇹", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Karachi", flag1: "🇵🇰", p2: "Delhi", flag2: "🇮🇳", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Lagos", flag1: "🇳🇬", p2: "Johannesburg", flag2: "🇿🇦", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Prague", flag1: "🇨🇿", p2: "Krakow", flag2: "🇵🇱", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Doha", flag1: "🇶🇦", p2: "Muscat", flag2: "🇴🇲", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },

  // High stakes – Rapid 15+10
  { p1: "Dubai", flag1: "🇦🇪", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Tokyo", flag1: "🇯🇵", p2: "New York", flag2: "🇺🇸", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Seoul", flag1: "🇰🇷", p2: "Berlin", flag2: "🇩🇪", stake: "50 USDT", format: "Blitz 5+3", tier: "high" },
  { p1: "Paris", flag1: "🇫🇷", p2: "São Paulo", flag2: "🇧🇷", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Singapore", flag1: "🇸🇬", p2: "Sydney", flag2: "🇦🇺", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Stockholm", flag1: "🇸🇪", p2: "Zurich", flag2: "🇨🇭", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "San Francisco", flag1: "🇺🇸", p2: "Amsterdam", flag2: "🇳🇱", stake: "50 USDT", format: "Blitz 5+3", tier: "high" },
  { p1: "Tashkent", flag1: "🇺🇿", p2: "Mumbai", flag2: "🇮🇳", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Istanbul", flag1: "🇹🇷", p2: "Cairo", flag2: "🇪🇬", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Madrid", flag1: "🇪🇸", p2: "Buenos Aires", flag2: "🇦🇷", stake: "50 USDT", format: "Blitz 5+3", tier: "high" },

  // Premium – 100 USDT
  { p1: "London", flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "New York", flag2: "🇺🇸", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Tokyo", flag1: "🇯🇵", p2: "Berlin", flag2: "🇩🇪", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Dubai", flag1: "🇦🇪", p2: "Singapore", flag2: "🇸🇬", stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
  { p1: "São Paulo", flag1: "🇧🇷", p2: "Seoul", flag2: "🇰🇷", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Paris", flag1: "🇫🇷", p2: "Mumbai", flag2: "🇮🇳", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Zurich", flag1: "🇨🇭", p2: "Tokyo", flag2: "🇯🇵", stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
  { p1: "Chicago", flag1: "🇺🇸", p2: "Stockholm", flag2: "🇸🇪", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Sydney", flag1: "🇦🇺", p2: "San Francisco", flag2: "🇺🇸", stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
  { p1: "Amsterdam", flag1: "🇳🇱", p2: "Cape Town", flag2: "🇿🇦", stake: "100 USDT", format: "Rapid 15+10", tier: "premium" },
  { p1: "Vienna", flag1: "🇦🇹", p2: "Tashkent", flag2: "🇺🇿", stake: "100 USDT", format: "Classical 30+0", tier: "premium" },

  // Elite – 250 USDT
  { p1: "New York", flag1: "🇺🇸", p2: "Singapore", flag2: "🇸🇬", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "London", flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "Tokyo", flag2: "🇯🇵", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Dubai", flag1: "🇦🇪", p2: "New York", flag2: "🇺🇸", stake: "250 USDT", format: "Rapid 15+10", tier: "elite" },
  { p1: "Zurich", flag1: "🇨🇭", p2: "Seoul", flag2: "🇰🇷", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Berlin", flag1: "🇩🇪", p2: "São Paulo", flag2: "🇧🇷", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Paris", flag1: "🇫🇷", p2: "San Francisco", flag2: "🇺🇸", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Singapore", flag1: "🇸🇬", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "250 USDT", format: "Rapid 15+10", tier: "elite" },
  { p1: "Sydney", flag1: "🇦🇺", p2: "Berlin", flag2: "🇩🇪", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Stockholm", flag1: "🇸🇪", p2: "Dubai", flag2: "🇦🇪", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },
  { p1: "Mumbai", flag1: "🇮🇳", p2: "New York", flag2: "🇺🇸", stake: "250 USDT", format: "Classical 30+0", tier: "elite" },

  // Whale tier – 500 USDT
  { p1: "New York", flag1: "🇺🇸", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
  { p1: "Dubai", flag1: "🇦🇪", p2: "Tokyo", flag2: "🇯🇵", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
  { p1: "Singapore", flag1: "🇸🇬", p2: "Zurich", flag2: "🇨🇭", stake: "500 USDT", format: "Classical 60+0", tier: "whale" },
  { p1: "Seoul", flag1: "🇰🇷", p2: "Paris", flag2: "🇫🇷", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
  { p1: "Berlin", flag1: "🇩🇪", p2: "San Francisco", flag2: "🇺🇸", stake: "500 USDT", format: "Classical 60+0", tier: "whale" },

  // More popular blitz – more cities
  { p1: "Tbilisi", flag1: "🇬🇪", p2: "Yerevan", flag2: "🇦🇲", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Minsk", flag1: "🇧🇾", p2: "Warsaw", flag2: "🇵🇱", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Almaty", flag1: "🇰🇿", p2: "Tashkent", flag2: "🇺🇿", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Tehran", flag1: "🇮🇷", p2: "Baghdad", flag2: "🇮🇶", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Dhaka", flag1: "🇧🇩", p2: "Kathmandu", flag2: "🇳🇵", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Colombo", flag1: "🇱🇰", p2: "Chennai", flag2: "🇮🇳", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Nairobi", flag1: "🇰🇪", p2: "Addis Ababa", flag2: "🇪🇹", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Accra", flag1: "🇬🇭", p2: "Dakar", flag2: "🇸🇳", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Caracas", flag1: "🇻🇪", p2: "Santiago", flag2: "🇨🇱", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Mexico City", flag1: "🇲🇽", p2: "Bogotá", flag2: "🇨🇴", stake: "5 USDT", format: "Blitz 5+0", tier: "small" },
  { p1: "Bucharest", flag1: "🇷🇴", p2: "Sofia", flag2: "🇧🇬", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Athens", flag1: "🇬🇷", p2: "Istanbul", flag2: "🇹🇷", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Vilnius", flag1: "🇱🇹", p2: "Tallinn", flag2: "🇪🇪", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Zagreb", flag1: "🇭🇷", p2: "Ljubljana", flag2: "🇸🇮", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Bern", flag1: "🇨🇭", p2: "Geneva", flag2: "🇨🇭", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Montreal", flag1: "🇨🇦", p2: "Boston", flag2: "🇺🇸", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Los Angeles", flag1: "🇺🇸", p2: "Vancouver", flag2: "🇨🇦", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Miami", flag1: "🇺🇸", p2: "Mexico City", flag2: "🇲🇽", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Houston", flag1: "🇺🇸", p2: "Dallas", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Osaka", flag1: "🇯🇵", p2: "Busan", flag2: "🇰🇷", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Shenzhen", flag1: "🇨🇳", p2: "Hong Kong", flag2: "🇭🇰", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Chengdu", flag1: "🇨🇳", p2: "Tokyo", flag2: "🇯🇵", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Melbourne", flag1: "🇦🇺", p2: "Singapore", flag2: "🇸🇬", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Perth", flag1: "🇦🇺", p2: "Jakarta", flag2: "🇮🇩", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Lahore", flag1: "🇵🇰", p2: "Kabul", flag2: "🇦🇫", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Bishkek", flag1: "🇰🇬", p2: "Dushanbe", flag2: "🇹🇯", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Ashgabat", flag1: "🇹🇲", p2: "Tehran", flag2: "🇮🇷", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Kampala", flag1: "🇺🇬", p2: "Dar es Salaam", flag2: "🇹🇿", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Abuja", flag1: "🇳🇬", p2: "Luanda", flag2: "🇦🇴", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Tunis", flag1: "🇹🇳", p2: "Algiers", flag2: "🇩🇿", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Tripoli", flag1: "🇱🇾", p2: "Cairo", flag2: "🇪🇬", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Kinshasa", flag1: "🇨🇩", p2: "Brazzaville", flag2: "🇨🇬", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Lomé", flag1: "🇹🇬", p2: "Cotonou", flag2: "🇧🇯", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Hanoi", flag1: "🇻🇳", p2: "Phnom Penh", flag2: "🇰🇭", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Ulaanbaatar", flag1: "🇲🇳", p2: "Beijing", flag2: "🇨🇳", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Kathmandu", flag1: "🇳🇵", p2: "Bangalore", flag2: "🇮🇳", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Yangon", flag1: "🇲🇲", p2: "Bangkok", flag2: "🇹🇭", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Colombo", flag1: "🇱🇰", p2: "Male", flag2: "🇲🇻", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Suva", flag1: "🇫🇯", p2: "Sydney", flag2: "🇦🇺", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Quito", flag1: "🇪🇨", p2: "Lima", flag2: "🇵🇪", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Asunción", flag1: "🇵🇾", p2: "Montevideo", flag2: "🇺🇾", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "La Paz", flag1: "🇧🇴", p2: "Santiago", flag2: "🇨🇱", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Havana", flag1: "🇨🇺", p2: "San Juan", flag2: "🇵🇷", stake: "5 USDT", format: "Blitz 5+0", tier: "small" },
  { p1: "Guatemala City", flag1: "🇬🇹", p2: "Tegucigalpa", flag2: "🇭🇳", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "San José", flag1: "🇨🇷", p2: "Panama City", flag2: "🇵🇦", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Kingston", flag1: "🇯🇲", p2: "Port of Spain", flag2: "🇹🇹", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Reykjavik", flag1: "🇮🇸", p2: "Dublin", flag2: "🇮🇪", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Edinburgh", flag1: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", p2: "Glasgow", flag2: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Cardiff", flag1: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Porto", flag1: "🇵🇹", p2: "Seville", flag2: "🇪🇸", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Lyon", flag1: "🇫🇷", p2: "Milan", flag2: "🇮🇹", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Naples", flag1: "🇮🇹", p2: "Palermo", flag2: "🇮🇹", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Gdańsk", flag1: "🇵🇱", p2: "Vilnius", flag2: "🇱🇹", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Bratislava", flag1: "🇸🇰", p2: "Vienna", flag2: "🇦🇹", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Ljubljana", flag1: "🇸🇮", p2: "Belgrade", flag2: "🇷🇸", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Skopje", flag1: "🇲🇰", p2: "Tirana", flag2: "🇦🇱", stake: "1 USDT", format: "Bullet 1+0", tier: "micro" },
  { p1: "Valletta", flag1: "🇲🇹", p2: "Nicosia", flag2: "🇨🇾", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Podgorica", flag1: "🇲🇪", p2: "Sarajevo", flag2: "🇧🇦", stake: "1 USDT", format: "Bullet 1+1", tier: "micro" },
  { p1: "Chisinau", flag1: "🇲🇩", p2: "Bucharest", flag2: "🇷🇴", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Erevan", flag1: "🇦🇲", p2: "Baku", flag2: "🇦🇿", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Tbilisi", flag1: "🇬🇪", p2: "Istanbul", flag2: "🇹🇷", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Amman", flag1: "🇯🇴", p2: "Beirut", flag2: "🇱🇧", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Tel Aviv", flag1: "🇮🇱", p2: "Dubai", flag2: "🇦🇪", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  { p1: "Manama", flag1: "🇧🇭", p2: "Kuwait City", flag2: "🇰🇼", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Sana'a", flag1: "🇾🇪", p2: "Muscat", flag2: "🇴🇲", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Kabul", flag1: "🇦🇫", p2: "Islamabad", flag2: "🇵🇰", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Tashkent", flag1: "🇺🇿", p2: "Bishkek", flag2: "🇰🇬", stake: "5 USDT", format: "Blitz 5+0", tier: "small" },
  { p1: "Novosibirsk", flag1: "🇷🇺", p2: "Almaty", flag2: "🇰🇿", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Krasnoyarsk", flag1: "🇷🇺", p2: "Irkutsk", flag2: "🇷🇺", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Vladivostok", flag1: "🇷🇺", p2: "Sapporo", flag2: "🇯🇵", stake: "10 USDT", format: "Blitz 5+0", tier: "popular" },
  { p1: "Anchorage", flag1: "🇺🇸", p2: "Tokyo", flag2: "🇯🇵", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Honolulu", flag1: "🇺🇸", p2: "Sydney", flag2: "🇦🇺", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "San Diego", flag1: "🇺🇸", p2: "Tijuana", flag2: "🇲🇽", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Seattle", flag1: "🇺🇸", p2: "Portland", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Minneapolis", flag1: "🇺🇸", p2: "Detroit", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 5+0", tier: "small" },
  { p1: "Atlanta", flag1: "🇺🇸", p2: "Washington", flag2: "🇺🇸", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Philadelphia", flag1: "🇺🇸", p2: "New York", flag2: "🇺🇸", stake: "10 USDT", format: "Rapid 10+0", tier: "popular" },
  { p1: "Phoenix", flag1: "🇺🇸", p2: "Las Vegas", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Denver", flag1: "🇺🇸", p2: "Salt Lake City", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Calgary", flag1: "🇨🇦", p2: "Edmonton", flag2: "🇨🇦", stake: "5 USDT", format: "Blitz 5+0", tier: "small" },
  { p1: "Ottawa", flag1: "🇨🇦", p2: "Quebec City", flag2: "🇨🇦", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "Winnipeg", flag1: "🇨🇦", p2: "Minneapolis", flag2: "🇺🇸", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Dublin", flag1: "🇮🇪", p2: "London", flag2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stake: "25 USDT", format: "Rapid 10+5", tier: "mid" },
  { p1: "Copenhagen", flag1: "🇩🇰", p2: "Stockholm", flag2: "🇸🇪", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Helsinki", flag1: "🇫🇮", p2: "Oslo", flag2: "🇳🇴", stake: "10 USDT", format: "Blitz 5+3", tier: "popular" },
  { p1: "Luxembourg", flag1: "🇱🇺", p2: "Brussels", flag2: "🇧🇪", stake: "25 USDT", format: "Rapid 10+0", tier: "mid" },
  { p1: "Monaco", flag1: "🇲🇨", p2: "Nice", flag2: "🇫🇷", stake: "100 USDT", format: "Classical 30+0", tier: "premium" },
  { p1: "Andorra", flag1: "🇦🇩", p2: "Barcelona", flag2: "🇪🇸", stake: "5 USDT", format: "Blitz 3+2", tier: "small" },
  { p1: "San Marino", flag1: "🇸🇲", p2: "Bologna", flag2: "🇮🇹", stake: "5 USDT", format: "Blitz 3+0", tier: "small" },
  { p1: "Vaduz", flag1: "🇱🇮", p2: "Zurich", flag2: "🇨🇭", stake: "50 USDT", format: "Rapid 15+10", tier: "high" },
  // Whale finals
  { p1: "London", flag1: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", p2: "Dubai", flag2: "🇦🇪", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
  { p1: "Tokyo", flag1: "🇯🇵", p2: "New York", flag2: "🇺🇸", stake: "500 USDT", format: "Classical 60+0", tier: "whale" },
  { p1: "Singapore", flag1: "🇸🇬", p2: "Berlin", flag2: "🇩🇪", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
  { p1: "Paris", flag1: "🇫🇷", p2: "Seoul", flag2: "🇰🇷", stake: "500 USDT", format: "Classical 60+0", tier: "whale" },
  { p1: "Zurich", flag1: "🇨🇭", p2: "São Paulo", flag2: "🇧🇷", stake: "500 USDT", format: "Classical 60+30", tier: "whale" },
];

// Precomputed shuffle so SSR and client match (no hydration mismatch)
const SHUFFLED = [...LIVE_MATCHES].sort((a, b) =>
  a.p1.localeCompare(b.p1)
);

const ACTIVE_CITIES = [
  "🇺🇸 New York", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 London", "🇦🇪 Dubai", "🇯🇵 Tokyo",
  "🇺🇿 Tashkent", "🇮🇳 Mumbai", "🇩🇪 Berlin", "🇧🇷 São Paulo",
  "🇫🇷 Paris", "🇰🇷 Seoul", "🇸🇬 Singapore", "🇦🇺 Sydney",
  "🇨🇭 Zurich", "🇨🇦 Toronto", "🇸🇪 Stockholm", "🇪🇸 Madrid",
  "🇦🇿 Baku", "🇦🇲 Yerevan", "🇰🇿 Almaty", "🇹🇷 Istanbul",
];

const TIER_STYLE: Record<string, string> = {
  micro: "text-fg-muted",
  small: "text-emerald-600",
  popular: "text-emerald-600 font-semibold",
  mid: "text-blue-600 font-semibold",
  high: "text-amber-600 font-bold",
  premium: "text-purple-600 font-bold",
  elite: "text-rose-600 font-bold",
  whale: "text-amber-500 font-extrabold",
};

const TIER_BADGE: Record<string, string> = {
  micro: "bg-surface border-line text-fg-muted",
  small: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700",
  popular: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
  mid: "bg-blue-500/10 border-blue-500/25 text-blue-700",
  high: "bg-amber-500/10 border-amber-500/25 text-amber-700",
  premium: "bg-purple-500/10 border-purple-500/25 text-purple-700",
  elite: "bg-rose-500/10 border-rose-500/25 text-rose-700",
  whale: "bg-amber-500/15 border-amber-500/30 text-amber-700",
};

const TIER_LABEL: Record<string, string> = {
  micro: "Micro",
  small: "Starter",
  popular: "Popular 🔥",
  mid: "Active ⚡",
  high: "High Stakes",
  premium: "VIP 👑",
  elite: "Elite 💎",
  whale: "Whale 🐋",
};

export function GlobeShowcase() {
  const [matchIndex, setMatchIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Flip match every 2.8s with crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setMatchIndex((prev) => (prev + 1) % SHUFFLED.length);
        setIsAnimating(false);
      }, 200);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Smooth infinite ticker scroll
  useEffect(() => {
    let rafId: number;
    let pos = 0;
    const speed = 0.35; // px per frame
    const tick = () => {
      if (!tickerRef.current) { rafId = requestAnimationFrame(tick); return; }
      const el = tickerRef.current;
      const halfWidth = el.scrollWidth / 2;
      pos += speed;
      if (pos >= halfWidth) pos -= halfWidth;
      el.style.transform = `translateX(-${pos}px)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const currentMatch = SHUFFLED[matchIndex];

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-full group py-2">
      {/* Ambient radial glow – no border, no box */}
      <div
        className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-full bg-radial from-emerald-500/12 via-blue-500/6 to-transparent blur-3xl opacity-80"
        aria-hidden="true"
      />

      {/* Globe container with static rings (no animation on the rings) */}
      <div className="relative flex items-center justify-center w-full">
        {/* Static concentric halos – plain opacity, zero animation */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="size-[390px] rounded-full border border-stone-400/25 opacity-40" />
          <div className="absolute size-[285px] rounded-full border border-dashed border-stone-400/20 opacity-30" />
          <div className="absolute size-[185px] rounded-full border border-stone-400/15 opacity-20" />
        </div>

        {/* Elliptical contact shadow */}
        <div
          className="pointer-events-none absolute bottom-4 sm:bottom-6 w-[270px] sm:w-[320px] h-6 rounded-[100%] bg-black/12 blur-xl"
          aria-hidden="true"
        />

        <Globe className="max-w-[460px]" />

        {/* Live Match Pill – crossfade animation via opacity only */}
        <div
          className="pointer-events-none absolute top-4 left-4 z-10"
          aria-live="polite"
          aria-label="Live match"
        >
          <div
            className={`flex items-center gap-2 rounded-full border border-stone-200/70 bg-white/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md transition-opacity duration-200 ${isAnimating ? "opacity-0" : "opacity-100"}`}
            style={{ boxShadow: "0 1px 8px 0 rgba(0,0,0,0.07)" }}
          >
            {/* Live radar ping */}
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>

            <span className="font-semibold text-[13px] text-stone-800 leading-none">
              {currentMatch.flag1} {currentMatch.p1}
              <span className="mx-1.5 text-stone-400">vs</span>
              {currentMatch.flag2} {currentMatch.p2}
            </span>

            <span className="text-stone-300">·</span>

            <span className={`font-bold text-[12px] tabular-nums ${TIER_STYLE[currentMatch.tier]}`}>
              {currentMatch.stake}
            </span>

            <span className={`hidden sm:inline rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${TIER_BADGE[currentMatch.tier]}`}>
              {TIER_LABEL[currentMatch.tier]}
            </span>
          </div>

          {/* Format sub-label */}
          <div className={`mt-1 text-center font-mono text-[10px] transition-opacity duration-200 ${isAnimating ? "opacity-0" : "opacity-100"}`}
            style={{ color: "rgba(120,113,108,0.7)" }}>
            {currentMatch.format}
          </div>
        </div>

        {/* Active players count chip – top right */}
        <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/85 px-2.5 py-1 text-[11px] font-mono shadow-sm backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-stone-700">{SHUFFLED.length}+</span>
          <span className="text-stone-500">active duels</span>
        </div>
      </div>

      {/* ── Infinite cities ticker strip ── */}
      <div className="w-full max-w-[520px] mt-3 z-10 overflow-hidden">
        <div
          className="whitespace-nowrap"
          aria-hidden="true"
        >
          <div ref={tickerRef} className="inline-flex items-center gap-4 will-change-transform">
            {/* Doubled so it loops seamlessly */}
            {[...ACTIVE_CITIES, ...ACTIVE_CITIES].map((city, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                <span className="size-1 shrink-0 rounded-full bg-emerald-500 opacity-80" />
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* Drag hint */}
        <div className="text-center mt-1.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-stone-400">
            <Icon name="arrow-counter-clockwise" size={11} className="text-stone-400" />
            Drag to rotate globe
          </span>
        </div>
      </div>
    </div>
  );
}
