"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
exports.supabase = (0, supabase_js_1.createClient)('https://nbxwptppjigieeqahukr.supabase.co', process.env.REACT_APP_SUPABASE_KEY);
