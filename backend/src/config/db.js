import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING )
        console.log('Kết nối đến MongoDB thành công');

        // Drop old unique index on name if it exists
        const Category = mongoose.model('Category');
        try {
            await Category.collection.dropIndex('name_1');
            console.log('Dropped old index name_1');
        } catch (error) {
            // Index might not exist, ignore
            console.log('Old index name_1 not found or already dropped');
        }
    } catch (error) {
        console.error('Lỗi kết nối đến MongoDB:', error);
        process.exit(1);
    }
}
