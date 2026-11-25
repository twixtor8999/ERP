import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check, Phone } from "lucide-react";
import { toast } from "sonner";
import { getAllCrmOrders, type CrmOrderRecord } from "@/features/crm/data/mockCrmReports";

interface CallingRow {
  sl: number;
  name: string;
  shop: string;
  village: string;
  villageKey: string;
  mobile: string;
  lastOrder: string;
  lastOrderTimestamp?: string;
  remark?: string;
}

const DEFAULT_CALLINGS: CallingRow[] = [
  {
    "sl": 1,
    "name": "Deeparam patel",
    "shop": "Jagadamba kirana store",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "7023207841",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 2,
    "name": "Dhanaram Choudhari",
    "shop": "Ramadev Kirani Store  Tamba",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9611573716",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 3,
    "name": "Dundappa P Patil",
    "shop": "Patil Kirana Traders",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9901526300",
    "lastOrder": "2026-11-21",
    "remark": "Order placed"
  },
  {
    "sl": 4,
    "name": "B r pujari",
    "shop": "B r pujari kiran",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "9611057297",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 5,
    "name": "Yallam madhar",
    "shop": "Dodamani General store",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "8095578038",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 6,
    "name": "Shivananda verappa biradar",
    "shop": "VERASHIDESHAR KIRANI STORE",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "9900728083",
    "lastOrder": "2026-11-21",
    "remark": "Order placed"
  },
  {
    "sl": 7,
    "name": "Kasturi A kumbar",
    "shop": "Kumbar kirani",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "8792572114",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 8,
    "name": "H d gogi",
    "shop": "Gogi kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "9972696642",
    "lastOrder": "2026-11-21",
    "remark": "Customer called"
  },
  {
    "sl": 9,
    "name": "S K Bagali",
    "shop": "S K Bagali",
    "village": "Lohagaon",
    "villageKey": "V1",
    "mobile": "9663248010",
    "lastOrder": "2026-11-20",
    "remark": "Order placed"
  },
  {
    "sl": 10,
    "name": "Sm Hiremath",
    "shop": "Mallikarjun. Kirani. Shop",
    "village": "Shegunashi",
    "villageKey": "V1",
    "mobile": "9611683596",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 11,
    "name": "Kashinath Bachibal",
    "shop": "Kashinath bachibal kirani store",
    "village": "Kallakavatagi",
    "villageKey": "V1",
    "mobile": "8971212290",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 12,
    "name": "S MDumake",
    "shop": "Dumake kirana",
    "village": "Kumathe",
    "villageKey": "V1",
    "mobile": "7337722124",
    "lastOrder": "2026-11-20",
    "remark": "Order placed"
  },
  {
    "sl": 13,
    "name": "Manohar Dhangi",
    "shop": "Dhangi kirana",
    "village": "Kumathe",
    "villageKey": "V1",
    "mobile": "9900733821",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 14,
    "name": "Manohar Dhangi",
    "shop": "Dhangi kirana",
    "village": "Kumathe",
    "villageKey": "V1",
    "mobile": "9900733821",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 15,
    "name": "M G Hiremath",
    "shop": "Mallikarjun kirani store",
    "village": "Tajapur",
    "villageKey": "V1",
    "mobile": "9483796275",
    "lastOrder": "2026-11-20",
    "remark": "Order placed"
  },
  {
    "sl": 16,
    "name": "Danappa vali",
    "shop": "Shri veerabreshwar kirani store",
    "village": "Tajapur",
    "villageKey": "V1",
    "mobile": "9986998236",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 17,
    "name": "Manohar Dhangi",
    "shop": "Dhangi kirana",
    "village": "Kumathe",
    "villageKey": "V1",
    "mobile": "9900733821",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  },
  {
    "sl": 18,
    "name": "Anil  akki",
    "shop": "Anil akki kirani store",
    "village": "Babanagar",
    "villageKey": "V1",
    "mobile": "9740261368",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 19,
    "name": "Sharanabasu",
    "shop": "Sharanbasu Hotel",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9611180393",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 20,
    "name": "Kasturi A kumbar",
    "shop": "Kumbar kirani",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "8792572114",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 21,
    "name": "Dapram mali",
    "shop": "Ramdev kirana store",
    "village": "Nagathan",
    "villageKey": "V1",
    "mobile": "9987943537",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 22,
    "name": "H d gogi",
    "shop": "Gogi kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "9972696642",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 23,
    "name": "Ramesh agasar",
    "shop": "agasar kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "8277845855",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 24,
    "name": "Gopal",
    "shop": "Bangalore Ayyangar Bakery",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "9686363284",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 25,
    "name": "H d gogi",
    "shop": "Gogi kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "9972696642",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 26,
    "name": "SIKumbar",
    "shop": "V. V. S. Bakery",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591707567",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 27,
    "name": "Siddappa V Anjutagi",
    "shop": "Siddappa V Anjutagi",
    "village": "Benakanahalli",
    "villageKey": "V1",
    "mobile": "9880873723",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 28,
    "name": "Sharanabasu",
    "shop": "Sharanbasu Hotel",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9611180393",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 29,
    "name": "Devindra bogappa kachapur",
    "shop": "Vedant kirana store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "6360130309",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 30,
    "name": "Santosh s Hadimani",
    "shop": "Adarsh kirani stores",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "8310789484",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 31,
    "name": "Shankar Makond",
    "shop": "Shree Guttilingeshwar Kirani Shop",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "8970805578",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 32,
    "name": "Danaram patel",
    "shop": "Ramadev kirana tamba",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9945899490",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 33,
    "name": "Dundappa P Patil",
    "shop": "Patil Kirana Traders",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9901526300",
    "lastOrder": "2026-11-14",
    "remark": "Order placed"
  },
  {
    "sl": 34,
    "name": "S S jevur",
    "shop": "Jevur kirana shop",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9945422280",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 35,
    "name": "Ganapati indi",
    "shop": "Jeevan kirani store",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "8660535411",
    "lastOrder": "2026-11-14",
    "remark": "Customer called"
  },
  {
    "sl": 36,
    "name": "Shrikant",
    "shop": "Shrikanth hotel",
    "village": "Sarawad",
    "villageKey": "V1",
    "mobile": "9448631595",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 37,
    "name": "Rasul Pated",
    "shop": "Jaanu Kirani Store",
    "village": "Sarawad",
    "villageKey": "V1",
    "mobile": "7975840908",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 38,
    "name": "Anil  akki",
    "shop": "Anil akki kirani store",
    "village": "Babanagar",
    "villageKey": "V1",
    "mobile": "9740261368",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 39,
    "name": "Hanamant tonashyal",
    "shop": "Hanamant kirana store",
    "village": "Bijapur (Rural)",
    "villageKey": "V1",
    "mobile": "9972241061",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 40,
    "name": "Chidanand",
    "shop": "Sangameshwar kirani store",
    "village": "Nagaral",
    "villageKey": "V1",
    "mobile": "7760820976",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 41,
    "name": "V S biradar",
    "shop": "V S biradar kirana store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "9972463586",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 42,
    "name": "Siddaray",
    "shop": "Daneshwari kirani store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "6362448428",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 43,
    "name": "Siddaray",
    "shop": "Daneshwari kirani store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "6362448428",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 44,
    "name": "S M Hiremath",
    "shop": "Maleyogisiddeswar general store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "9620802207",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 45,
    "name": "Prashath patil",
    "shop": "Maliyogoswar",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "7026442455",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 46,
    "name": "Shikandar Takkod",
    "shop": "Hajimastan Kirani stores",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9632583098",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 47,
    "name": "Sharada Biradar",
    "shop": "Sharada kirana store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9611781716",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 48,
    "name": "Santosh ninganur",
    "shop": "Santsh kirana store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9900777681",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 49,
    "name": "Santosh ninganur",
    "shop": "Santsh kirana store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9900777681",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 50,
    "name": "S B gote",
    "shop": "Basaveshwar kirani store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "7353001774",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 51,
    "name": "Bhimu",
    "shop": "Hanuman kirani store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9980160381",
    "lastOrder": "2026-11-13",
    "remark": "Order placed"
  },
  {
    "sl": 52,
    "name": "Ramu savlgi",
    "shop": "Annavar hotel",
    "village": "Ratnapura",
    "villageKey": "V1",
    "mobile": "9902737992",
    "lastOrder": "2026-11-13",
    "remark": "Customer called"
  },
  {
    "sl": 53,
    "name": "Shankar Gadde",
    "shop": "Gadde kirani shop",
    "village": "Golasangi",
    "villageKey": "V1",
    "mobile": "9964951937",
    "lastOrder": "2026-11-12",
    "remark": "Customer called"
  },
  {
    "sl": 54,
    "name": "Kashinath Bachibal",
    "shop": "Kashinath bachibal kirani store",
    "village": "Kallakavatagi",
    "villageKey": "V1",
    "mobile": "8971212290",
    "lastOrder": "2026-11-10",
    "remark": "Order placed"
  },
  {
    "sl": 55,
    "name": "Kashinath Bachibal",
    "shop": "Kashinath bachibal kirani store",
    "village": "Kallakavatagi",
    "villageKey": "V1",
    "mobile": "8971212290",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 56,
    "name": "Alok walikar",
    "shop": "Alok walikar",
    "village": "Kallakavatagi",
    "villageKey": "V1",
    "mobile": "8073552478",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 57,
    "name": "Basavaraj Gadyal",
    "shop": "Basavaraj Gadyal",
    "village": "Kallakavatagi",
    "villageKey": "V1",
    "mobile": "9731292381",
    "lastOrder": "2026-11-10",
    "remark": "Order placed"
  },
  {
    "sl": 58,
    "name": "Somnata pujari",
    "shop": "Somlegshwar kirani Store",
    "village": "Somadevarahatti",
    "villageKey": "V1",
    "mobile": "7760159571",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 59,
    "name": "Anantpur",
    "shop": "I s anantpur",
    "village": "Kanamadi",
    "villageKey": "V1",
    "mobile": "7795253908",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 60,
    "name": "Sujata anantpur",
    "shop": "Shivyogi kirana",
    "village": "Kanamadi",
    "villageKey": "V1",
    "mobile": "8904541928",
    "lastOrder": "2026-11-10",
    "remark": "Order placed"
  },
  {
    "sl": 61,
    "name": "M G Hiremath",
    "shop": "Mallikarjun kirani store",
    "village": "Tajapur",
    "villageKey": "V1",
    "mobile": "9483796275",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 62,
    "name": "Jagadev",
    "shop": "Polin kirani Shop",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "7090358440",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 63,
    "name": "S M Hiremath",
    "shop": "Maleyogisiddeswar general store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "9620802207",
    "lastOrder": "2026-11-10",
    "remark": "Order placed"
  },
  {
    "sl": 64,
    "name": "V S biradar",
    "shop": "V S biradar kirana store",
    "village": "Dhanyal",
    "villageKey": "V1",
    "mobile": "9972463586",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 65,
    "name": "Bhimu",
    "shop": "Hanuman kirani store",
    "village": "Dasyal",
    "villageKey": "V1",
    "mobile": "9980160381",
    "lastOrder": "2026-11-10",
    "remark": "Customer called"
  },
  {
    "sl": 66,
    "name": "Arif",
    "shop": "ARef hotel",
    "village": "Makanapur",
    "villageKey": "V1",
    "mobile": "7795773143",
    "lastOrder": "2026-11-06",
    "remark": "Order placed"
  },
  {
    "sl": 67,
    "name": "A B BHAGAWAN",
    "shop": "A B BHAGAWAN KIRANA STORE",
    "village": "Makanapur",
    "villageKey": "V1",
    "mobile": "9343761131",
    "lastOrder": "2026-11-06",
    "remark": "Customer called"
  },
  {
    "sl": 68,
    "name": "S r biradar",
    "shop": "S R biradar kirani shop",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "7619334315",
    "lastOrder": "2026-11-04",
    "remark": "Customer called"
  },
  {
    "sl": 69,
    "name": "S r biradar",
    "shop": "S R biradar kirani shop",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "7619334315",
    "lastOrder": "2026-11-04",
    "remark": "Order placed"
  },
  {
    "sl": 70,
    "name": "S K Balagar",
    "shop": "Balagar kirani store",
    "village": "Atharga",
    "villageKey": "V1",
    "mobile": "9945446565",
    "lastOrder": "2026-11-04",
    "remark": "Customer called"
  },
  {
    "sl": 71,
    "name": "Ganapati indi",
    "shop": "Jeevan kirani store",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "8660535411",
    "lastOrder": "2026-11-04",
    "remark": "Customer called"
  },
  {
    "sl": 72,
    "name": "S r biradar",
    "shop": "S R biradar kirani shop",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "7619334315",
    "lastOrder": "2026-11-04",
    "remark": "Order placed"
  },
  {
    "sl": 73,
    "name": "Ganapati indi",
    "shop": "Jeevan kirani store",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "8660535411",
    "lastOrder": "2026-11-04",
    "remark": "Customer called"
  },
  {
    "sl": 74,
    "name": "Ajij",
    "shop": "Ajij",
    "village": "Malaghan",
    "villageKey": "V1",
    "mobile": "8431377142",
    "lastOrder": "2026-10-30",
    "remark": "Customer called"
  },
  {
    "sl": 75,
    "name": "Arun Devargudi",
    "shop": "Daneshwar  kirana store",
    "village": "Muttagi",
    "villageKey": "V1",
    "mobile": "9590705355",
    "lastOrder": "2026-10-28",
    "remark": "Order placed"
  },
  {
    "sl": 76,
    "name": "Anil hosamani",
    "shop": "Sinddu kirana store",
    "village": "Aliyabad",
    "villageKey": "V1",
    "mobile": "9482380607",
    "lastOrder": "2026-11-04",
    "remark": "Customer called"
  },
  {
    "sl": 77,
    "name": "Basavaraj badiger",
    "shop": "Appaji kirana store",
    "village": "Kudgi",
    "villageKey": "V1",
    "mobile": "9880463327",
    "lastOrder": "2026-11-05",
    "remark": "Customer called"
  },
  {
    "sl": 78,
    "name": "Shivaji jedava",
    "shop": "Shubam dabha",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "9742062816",
    "lastOrder": "2026-11-09",
    "remark": "Order placed"
  },
  {
    "sl": 79,
    "name": "SANIYA GODIYAL",
    "shop": "SANIYA KIRANI STORE",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "6366609100",
    "lastOrder": "2026-11-09",
    "remark": "Customer called"
  },
  {
    "sl": 80,
    "name": "CV KALYANSHATTI",
    "shop": "Veerabadareswar kiran store",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "8105999037",
    "lastOrder": "2026-11-09",
    "remark": "Customer called"
  },
  {
    "sl": 81,
    "name": "Kalyan Shetty",
    "shop": "Kalyan Shetty",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "9916046015",
    "lastOrder": "2026-11-09",
    "remark": "Order placed"
  },
  {
    "sl": 82,
    "name": "P m Mamadapur",
    "shop": "Basaveswar kirani stor",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "8105622352",
    "lastOrder": "2026-11-09",
    "remark": "Customer called"
  },
  {
    "sl": 83,
    "name": "SANIYA GODIYAL",
    "shop": "SANIYA KIRANI STORE",
    "village": "Mulawad",
    "villageKey": "V1",
    "mobile": "6366609100",
    "lastOrder": "2026-11-09",
    "remark": "Customer called"
  },
  {
    "sl": 84,
    "name": "SIKumbar",
    "shop": "V. V. S. Bakery",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591707567",
    "lastOrder": "2026-11-11",
    "remark": "Order placed"
  },
  {
    "sl": 85,
    "name": "Dundappa P Patil",
    "shop": "Patil Kirana Traders",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9901526300",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 86,
    "name": "Dundappa P Patil",
    "shop": "Patil Kirana Traders",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9901526300",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 87,
    "name": "S S jevur",
    "shop": "Jevur kirana shop",
    "village": "Tamba",
    "villageKey": "V1",
    "mobile": "9945422280",
    "lastOrder": "2026-11-11",
    "remark": "Order placed"
  },
  {
    "sl": 88,
    "name": "Basavraj kolkura",
    "shop": "Kolkura. General kirani. Store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591951569",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 89,
    "name": "Basavraj kolkura",
    "shop": "Kolkura. General kirani. Store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591951569",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 90,
    "name": "Ramesh agasar",
    "shop": "agasar kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "8277845855",
    "lastOrder": "2026-11-11",
    "remark": "Order placed"
  },
  {
    "sl": 91,
    "name": "Sharanabasu",
    "shop": "Sharanbasu Hotel",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9611180393",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 92,
    "name": "Annaraj bagalakot",
    "shop": "Annaraj bagalakot kirana store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9980963759",
    "lastOrder": "2026-11-11",
    "remark": "Customer called"
  },
  {
    "sl": 93,
    "name": "Ananda kumbar",
    "shop": "Vijayalakshmi kirana store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "6362266254",
    "lastOrder": "2026-11-11",
    "remark": "Order placed"
  },
  {
    "sl": 94,
    "name": "Vital r",
    "shop": "Sagameshvara kiran",
    "village": "Bellubbi",
    "villageKey": "V1",
    "mobile": "9900656750",
    "lastOrder": "2026-11-17",
    "remark": "Customer called"
  },
  {
    "sl": 95,
    "name": "B Cake house",
    "shop": "Bakery",
    "village": "Makanapur",
    "villageKey": "V1",
    "mobile": "7878737302",
    "lastOrder": "2026-11-17",
    "remark": "Customer called"
  },
  {
    "sl": 96,
    "name": "Sharanabasu",
    "shop": "Sharanbasu Hotel",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9611180393",
    "lastOrder": "2026-11-18",
    "remark": "Order placed"
  },
  {
    "sl": 97,
    "name": "Devindra bogappa kachapur",
    "shop": "Vedant kirana store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "6360130309",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 98,
    "name": "H d gogi",
    "shop": "Gogi kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "9972696642",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 99,
    "name": "Ramesh agasar",
    "shop": "agasar kirani",
    "village": "Jambagi(A)",
    "villageKey": "V1",
    "mobile": "8277845855",
    "lastOrder": "2026-11-18",
    "remark": "Order placed"
  },
  {
    "sl": 100,
    "name": "Ganapati indi",
    "shop": "Jeevan kirani store",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "8660535411",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 101,
    "name": "Ganapati indi",
    "shop": "Jeevan kirani store",
    "village": "Bolegaon",
    "villageKey": "V1",
    "mobile": "8660535411",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 102,
    "name": "SIKumbar",
    "shop": "V. V. S. Bakery",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591707567",
    "lastOrder": "2026-11-18",
    "remark": "Order placed"
  },
  {
    "sl": 103,
    "name": "Basavraj kolkura",
    "shop": "Kolkura. General kirani. Store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591951569",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 104,
    "name": "Basavraj kolkura",
    "shop": "Kolkura. General kirani. Store",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9591951569",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 105,
    "name": "Santosh s Hadimani",
    "shop": "Adarsh kirani stores",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "8310789484",
    "lastOrder": "2026-11-18",
    "remark": "Order placed"
  },
  {
    "sl": 106,
    "name": "Sharanabasu",
    "shop": "Sharanbasu Hotel",
    "village": "Chikkarugi",
    "villageKey": "V1",
    "mobile": "9611180393",
    "lastOrder": "2026-11-18",
    "remark": "Customer called"
  },
  {
    "sl": 107,
    "name": "Ramesh Daddimai",
    "shop": "Maradisiddesvar",
    "village": "Kumathe",
    "villageKey": "V1",
    "mobile": "8971992467",
    "lastOrder": "2026-11-20",
    "remark": "Customer called"
  }
];

const REMARKS_LIST = [
  "Customer remark...",
  "Number not reachable / wrong — update new number",
  "Shop closed",
  "Call back later",
  "Stock available, order later",
  "Not interested",
  "Order placed",
  "Payment pending",
];

export function CallingsRunSheetView() {
  const navigate = useNavigate();

  const [beatDay, setBeatDay] = useState("Sunday");
  const [routeName, setRouteName] = useState("Bijapur");
  const [villageKey, setVillageKey] = useState("Nil");
  const [village, setVillage] = useState("All villages (1)");
  const [pageSearch, setPageSearch] = useState("");

  const [callings, setCallings] = useState<CallingRow[]>(DEFAULT_CALLINGS);
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

  const handleCopy = (mobile: string) => {
    navigator.clipboard?.writeText(mobile);
    setCopiedMobile(mobile);
    toast.success("Phone Number Copied!", {
      description: `${mobile} copied to clipboard`,
    });
    setTimeout(() => setCopiedMobile(null), 1500);
  };

  const handleRemarkChange = (sl: number, val: string) => {
    setCallings((prev) =>
      prev.map((c) => (c.sl === sl ? { ...c, remark: val } : c))
    );
    if (val && val !== "Customer remark...") {
      toast.success("Remark Recorded", {
        description: `Customer remark updated: "${val}"`,
      });
    }
  };

  // Load dynamic orders and merge with callings so latest orders show on top
  const mergedCallings = useMemo((): CallingRow[] => {
    try {
      const allOrders = getAllCrmOrders();
      // Map customerPhone/name to latest order
      const orderMap = new Map<string, CrmOrderRecord>();
      for (const ord of allOrders) {
        const phone = (ord.customerPhone || "").replace(/\D/g, "");
        const name = ord.customerName.toLowerCase().trim();
        if (phone && !orderMap.has(phone)) {
          orderMap.set(phone, ord);
        }
        if (name && !orderMap.has(name)) {
          orderMap.set(name, ord);
        }
      }

      const updated = callings.map((c) => {
        const cleanMobile = c.mobile.replace(/\D/g, "");
        const cleanName = c.name.toLowerCase().trim();
        const matched = orderMap.get(cleanMobile) || orderMap.get(cleanName);

        if (matched) {
          // Format date as YYYY-MM-DD
          let formattedDate = matched.orderDate;
          if (formattedDate.includes("-") && formattedDate.split("-")[0]?.length === 2) {
            const [d, m, y] = formattedDate.split("-");
            formattedDate = `${y}-${m}-${d}`;
          }
          return {
            ...c,
            lastOrder: formattedDate || c.lastOrder,
            lastOrderTimestamp: matched.placedTimestamp || `${formattedDate} 10:00 am`,
          };
        }
        return c;
      });

      // Sort with latest order dates/calls on top (descending)
      return updated.sort((a, b) => {
        const dateA = a.lastOrder || "";
        const dateB = b.lastOrder || "";
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA); // newest date first
        }
        return (b.lastOrderTimestamp || "").localeCompare(a.lastOrderTimestamp || "");
      });
    } catch {
      return callings;
    }
  }, [callings]);

  const filteredCallings = useMemo(() => {
    return mergedCallings.filter((c) => {
      if (!pageSearch) return true;
      const q = pageSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.shop.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.village.toLowerCase().includes(q)
      );
    });
  }, [mergedCallings, pageSearch]);

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a]">
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
        Callings
      </h1>

      {/* Page Search Input */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Filter Row: Beat Day, Route Name, Village Key, Village, Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
          {/* Beat Day */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Beat Day
            </label>
            <select
              value={beatDay}
              onChange={(e) => setBeatDay(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Sunday</option>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
            </select>
          </div>

          {/* Route Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Route Name
            </label>
            <select
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Bijapur</option>
              <option>Tamba</option>
              <option>DEVARHIPARAGI</option>
              <option>Tadavalaga</option>
            </select>
          </div>

          {/* Village Key */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Village Key
            </label>
            <select
              value={villageKey}
              onChange={(e) => setVillageKey(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Nil</option>
              <option>V1</option>
              <option>V2</option>
              <option>V3</option>
            </select>
          </div>

          {/* Village */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Village
            </label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>All villages (1)</option>
              <option>Bijapur (Rural)</option>
              <option>Tadavalga</option>
              <option>Rugi</option>
            </select>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2 justify-end col-span-2 sm:col-span-1 pt-1">
            <button
              disabled
              className="text-xs font-bold text-slate-400 px-2 py-1 rounded cursor-not-allowed"
            >
              ← Previous
            </button>
            <button className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold px-3 py-1 rounded-md shadow-2xs">
              Next →
            </button>
          </div>
        </div>

        {/* Route Summary Sub-line */}
        <div className="pt-1 text-[11px] font-bold text-slate-400">
          {beatDay} · {routeName} · 1 village(s) · {filteredCallings.length} customer(s)
        </div>
      </div>

      {/* Callings Table matching Reference App Screenshot 9 with internal 8-row viewport scroll */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 shadow-xs">
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-3 text-left w-10">Sl</th>
                <th className="py-2.5 px-3 text-left">Customer Name</th>
                <th className="py-2.5 px-3 text-left">Village</th>
                <th className="py-2.5 px-3 text-left">Village Key</th>
                <th className="py-2.5 px-3 text-left">Mobile No</th>
                <th className="py-2.5 px-3 text-left">Last order</th>
                <th className="py-2.5 px-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredCallings.map((c) => (
                <tr key={c.sl} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-slate-500 font-bold">{c.sl}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{c.shop}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{c.village}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{c.villageKey}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">{c.mobile}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{c.lastOrder}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Call Now button */}
                      <a
                        href={`tel:+91${c.mobile}`}
                        className="inline-flex items-center gap-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call Now</span>
                      </a>

                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(c.mobile)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        {copiedMobile === c.mobile ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          "Copy"
                        )}
                      </button>

                      {/* Place Order button */}
                      <button
                        onClick={() => navigate(`/pos?customer=${c.sl}`)}
                        className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        Place Order
                      </button>

                      {/* Customer Remark Dropdown */}
                      <select
                        value={c.remark || ""}
                        onChange={(e) => handleRemarkChange(c.sl, e.target.value)}
                        className="text-[11px] font-medium bg-[#f8fafc] border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none max-w-[170px]"
                      >
                        {REMARKS_LIST.map((r, i) => (
                          <option key={i} value={i === 0 ? "" : r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
