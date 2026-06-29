import dayjs from 'dayjs';
import './Footer.css'

export function Footer() {
    const year = dayjs().format('YYYY');

    return (
        <>
            <footer>
                Copywright &copy; {year} Zutrad Ventures Ltd.
            </footer>
        </>
    );
}