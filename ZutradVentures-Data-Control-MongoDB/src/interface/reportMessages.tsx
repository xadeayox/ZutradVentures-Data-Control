export interface reportMessages {
    id: number,
    reportDetails: string,
    factory: string,
    lineNumber: number,
    files?: File[],
    dateLogged: string,
    user: string
}