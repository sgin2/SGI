const { MongoClient } = require('mongodb');

// تعريف رابط الاتصال واسم قاعدة البيانات واسم المجموعة الخاصة بالمعلمين من متغيرات البيئة
const uri = process.env.MONGODB_URI_TEACHERS;
const dbName = "TeachersDB";
const collectionName = 'enrolled_teachers_tbl';

exports.handler = async (event, context) => {
    console.log("بدء وظيفة إضافة المعلم");
    console.log("قيمة MONGODB_URI_TEACHERS:", process.env.MONGODB_URI_TEACHERS);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let client;

    try {
        const { serial_number, residency_number } = JSON.parse(event.body);

        if (!serial_number || !residency_number) {
            return { statusCode: 400, body: JSON.stringify({ error: 'الرقم التسلسلي ورقم الإقامة كلاهما مطلوبان للمعلم.' }) };
        }

        console.log("محاولة الاتصال بقاعدة البيانات...");
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 5000 }); // إضافة خيارات للاتصال ومهلة
        await client.connect();
        console.log("تم الاتصال بقاعدة البيانات بنجاح!");

        const database = client.db(dbName);
        const teachersCollection = database.collection(collectionName);

        console.log("محاولة إدراج المعلم:", { serial_number, residency_number, created_at: new Date() });
        const result = await teachersCollection.insertOne({ serial_number, residency_number, created_at: new Date() });
        console.log("نتيجة الإدراج:", result);

        if (result.acknowledged && result.insertedId) {
            return { statusCode: 200, body: JSON.stringify({ message: 'تمت إضافة المعلم بنجاح!' }) };
        } else {
            return { statusCode: 500, body: JSON.stringify({ error: 'فشل في إضافة المعلم إلى قاعدة البيانات.' }) };
        }

    } catch (error) {
        console.error('خطأ في وظيفة إضافة المعلم:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'حدث خطأ غير متوقع أثناء إضافة المعلم.' }) };
    } finally {
        if (client) {
            await client.close();
            console.log("تم إغلاق اتصال قاعدة البيانات.");
        }
    }
};