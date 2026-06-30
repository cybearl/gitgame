import computerIcon from "@react95-icons/Computer3_16x16_4.png"
import TitleBar from "@renderer/components/ui/TitleBar"
import originalTheme from "react95/dist/themes/original"
import { ThemeProvider } from "styled-components"
import MainLayout from "@/renderer/components/layouts/main"

export default function App() {
    return (
        <ThemeProvider theme={originalTheme}>
            <MainLayout>
                <TitleBar title="GitGame" icon={computerIcon} />

                <div className="w-full flex-1 flex">
                    <div className="absolute w-full h-full flex justify-center items-center">
                        <img
                            src="/assets/images/cthulhu.png"
                            alt="close"
                            className="w-[10%] [image-rendering:pixelated] opacity-5"
                        />
                    </div>
                </div>
            </MainLayout>
        </ThemeProvider>
    )
}
