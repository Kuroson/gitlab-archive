export default class Stack<T> {
    private items: T[] = [];

    public push = (item: T): void => {
        this.items.push(item);
    };

    public pop = (): T | undefined => {
        return this.items.pop();
    };

    public isEmpty = (): boolean => {
        return this.items.length === 0;
    };
}
