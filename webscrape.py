from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from sys import argv

def scrapAndEmbed(link):
    options = webdriver.FirefoxOptions()
    options.add_argument("-headless")
    options.page_load_strategy = "eager"

    dict_for_embedding={}
    max_retries = 3
    retry_count = 0
    
    driver = None
    

    while retry_count < max_retries:
        try: 
            print(f"start")
            driver = webdriver.Firefox(options=options)
            print(f"open")
            driver.get(link)
            print(f"connect")
            wait = WebDriverWait(driver, 10)
            name = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "NameTitle__Name-dowf0z-0")))
            print(f"1")
            subject = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "TeacherDepartment__StyledDepartmentLink-fl79e8-0")))
            print(f"2")
            stars = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "RatingValue__Numerator-qw8sqy-2")))
            print(f"3")
            reviewList = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "RatingsList__RatingsUL-hn9one-0")))
            print(f"")
            reviews = reviewList.find_elements(by = By.CLASS_NAME, value = "Comments__StyledComments-dzzyvm-0")
            review = ""
            for r in reviews:
                review+=r.text +  ' \n'
            dict_for_embedding = {"professor": name.text,"review": review,"subject": subject.text,"stars": stars.text}
            break
        
        except Exception as e:
            print(f"An error occurred: {e}")
            retry_count += 1
            print(f"Retrying {retry_count}/{max_retries}...")
            
        finally: 
            if driver is not None:
                try:
                    driver.quit()
                except Exception as e:
                    print(f"Error quitting the driver: {e}")

    return dict_for_embedding

if __name__ == "__main__":
    # Read the input from command line arguments
    input_data = argv[1]
    # Call the function and print the result
    print(scrapAndEmbed(input_data))



