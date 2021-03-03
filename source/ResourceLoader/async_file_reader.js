class AsyncFileReader
{
    static async readAsArrayBuffer(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(path);
        });
    }

    static async readAsText(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(path);
        });
    }

    static async readAsDataURL(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(path);
        });
    }
}

export { AsyncFileReader };
